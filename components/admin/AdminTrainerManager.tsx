'use client';

import {ChangeEvent, useMemo, useState} from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import {Locale} from '@/lib/locale';
import {useTrainerPool} from '@/components/providers/TrainerPoolProvider';
import {useSessionPool} from '@/components/providers/SessionPoolProvider';
import {Trainer} from '@/lib/types/trainer';
import {getTrainerFullName} from '@/lib/utils/trainer';

type FormState = {
  name: string;
  lastName: string;
  tagsRaw: string;
  bioRu: string;
  currentPhotoUrl: string;
  photoFileDataUrl: string;
};

const TRAINER_POOL_STORAGE_SOFT_LIMIT = 4_500_000;
const TRAINER_PHOTO_MAX_SIDE = 1280;
const TRAINER_PHOTO_TARGET_CHARS = 320_000;
const IMAGE_TOO_LARGE_ERROR = 'IMAGE_TOO_LARGE';

const INITIAL_FORM: FormState = {
  name: '',
  lastName: '',
  tagsRaw: '',
  bioRu: '',
  currentPhotoUrl: '',
  photoFileDataUrl: ''
};

function readRawFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Failed to read file'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function loadImageFromDataUrl(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to read file'));
    image.src = dataUrl;
  });
}

function willExceedTrainerStorage(next: Trainer[]) {
  try {
    return JSON.stringify(next).length > TRAINER_POOL_STORAGE_SOFT_LIMIT;
  } catch {
    return true;
  }
}

async function readFileAsDataUrl(file: File) {
  const sourceDataUrl = await readRawFileAsDataUrl(file);
  const image = await loadImageFromDataUrl(sourceDataUrl);
  const maxSide = Math.max(image.width, image.height);
  const scale = maxSide > TRAINER_PHOTO_MAX_SIDE ? TRAINER_PHOTO_MAX_SIDE / maxSide : 1;
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to read file');
  }
  ctx.drawImage(image, 0, 0, width, height);

  for (const mimeType of ['image/webp', 'image/jpeg']) {
    for (const quality of [0.82, 0.72, 0.62, 0.54]) {
      const candidate = canvas.toDataURL(mimeType, quality);
      if (candidate.length <= TRAINER_PHOTO_TARGET_CHARS) {
        return candidate;
      }
    }
  }

  throw new Error(IMAGE_TOO_LARGE_ERROR);
}

function trainerToFormState(trainer: Trainer): FormState {
  return {
    name: trainer.name,
    lastName: trainer.lastName,
    tagsRaw: trainer.tags.join(', '),
    bioRu: trainer.bio.ru,
    currentPhotoUrl: trainer.photoUrl,
    photoFileDataUrl: ''
  };
}

export default function AdminTrainerManager({locale}: {locale: Locale}) {
  const isRu = locale === 'ru';
  const {trainers, addTrainer, updateTrainer, removeTrainer} = useTrainerPool();
  const {sessions, replaceSessions} = useSessionPool();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(false);

  const [editingTrainerId, setEditingTrainerId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(INITIAL_FORM);
  const [editError, setEditError] = useState<string | null>(null);
  const [isLoadingEditPhoto, setIsLoadingEditPhoto] = useState(false);

  const sessionCountByTrainer = useMemo(() => {
    const now = Date.now();
    const map = new Map<string, number>();
    for (const session of sessions) {
      if (new Date(session.startsAt).getTime() <= now) {
        continue;
      }
      map.set(session.trainerId, (map.get(session.trainerId) ?? 0) + 1);
    }
    return map;
  }, [sessions]);

  const editingLinkedSessions = editingTrainerId ? sessionCountByTrainer.get(editingTrainerId) ?? 0 : 0;

  const onPhotoFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(isRu ? 'Можно загружать только файлы изображений.' : 'Image files only.');
      return;
    }

    setError(null);
    setIsLoadingPhoto(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setForm((prev) => ({...prev, photoFileDataUrl: dataUrl}));
    } catch (error) {
      const isImageTooLarge = error instanceof Error && error.message === IMAGE_TOO_LARGE_ERROR;
      setError(
        isImageTooLarge
          ? isRu
            ? 'Фото слишком большое для хранения в браузере. Выберите файл меньшего размера.'
            : 'Image is too large for browser storage. Please use a smaller file.'
          : isRu
            ? 'Не удалось прочитать файл.'
            : 'Failed to read file.'
      );
    } finally {
      setIsLoadingPhoto(false);
      event.target.value = '';
    }
  };

  const onEditPhotoFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setEditError(isRu ? 'Можно загружать только файлы изображений.' : 'Image files only.');
      return;
    }

    setEditError(null);
    setIsLoadingEditPhoto(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setEditForm((prev) => ({...prev, photoFileDataUrl: dataUrl}));
    } catch (error) {
      const isImageTooLarge = error instanceof Error && error.message === IMAGE_TOO_LARGE_ERROR;
      setEditError(
        isImageTooLarge
          ? isRu
            ? 'Фото слишком большое для хранения в браузере. Выберите файл меньшего размера.'
            : 'Image is too large for browser storage. Please use a smaller file.'
          : isRu
            ? 'Не удалось прочитать файл.'
            : 'Failed to read file.'
      );
    } finally {
      setIsLoadingEditPhoto(false);
      event.target.value = '';
    }
  };

  const onCreateTrainer = () => {
    setError(null);
    setMessage(null);

    if (!form.photoFileDataUrl) {
      setError(isRu ? 'Добавьте фото тренера файлом.' : 'Upload a trainer photo file.');
      return;
    }

    const tags = form.tagsRaw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const draftTrainer: Trainer = {
      id: 't-draft',
      name: form.name.trim(),
      lastName: form.lastName.trim(),
      photoUrl: form.photoFileDataUrl.trim(),
      tags,
      bio: {ru: form.bioRu.trim(), en: form.bioRu.trim()}
    };

    if (willExceedTrainerStorage([...trainers, draftTrainer])) {
      setError(
        isRu
          ? 'Слишком много данных для хранения в браузере. Уменьшите фото или удалите часть тренеров.'
          : 'Too much data for browser storage. Use smaller photos or remove some trainers.'
      );
      return;
    }

    const created = addTrainer({
      name: form.name,
      lastName: form.lastName,
      photoUrl: form.photoFileDataUrl,
      tags,
      bio: {ru: form.bioRu, en: form.bioRu}
    });

    if (!created) {
      setError(
        isRu
          ? 'Заполните имя, фамилию, описание и загрузите фото файлом.'
          : 'Fill name, last name, bio, and upload a photo file.'
      );
      return;
    }

    setForm(INITIAL_FORM);
    const createdName = getTrainerFullName(created);
    setMessage(isRu ? `Тренер ${createdName} добавлен.` : `Trainer ${createdName} added.`);
  };

  const openEditModal = (trainer: Trainer) => {
    setEditingTrainerId(trainer.id);
    setEditForm(trainerToFormState(trainer));
    setEditError(null);
  };

  const closeEditModal = () => {
    setEditingTrainerId(null);
    setEditForm(INITIAL_FORM);
    setEditError(null);
    setIsLoadingEditPhoto(false);
  };

  const onSaveEdit = () => {
    if (!editingTrainerId) return;
    setEditError(null);
    setMessage(null);

    const nextPhotoUrl = editForm.photoFileDataUrl || editForm.currentPhotoUrl.trim();
    const tags = editForm.tagsRaw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const currentTrainer = trainers.find((item) => item.id === editingTrainerId);
    if (currentTrainer) {
      const nextTrainer: Trainer = {
        ...currentTrainer,
        name: editForm.name.trim(),
        lastName: editForm.lastName.trim(),
        photoUrl: nextPhotoUrl.trim(),
        tags,
        bio: {ru: editForm.bioRu.trim(), en: editForm.bioRu.trim()}
      };
      const nextTrainerPool = trainers.map((item) => (item.id === editingTrainerId ? nextTrainer : item));
      if (willExceedTrainerStorage(nextTrainerPool)) {
        setEditError(
          isRu
            ? 'Слишком много данных для хранения в браузере. Уменьшите фото или удалите часть тренеров.'
            : 'Too much data for browser storage. Use smaller photos or remove some trainers.'
        );
        return;
      }
    }

    const updated = updateTrainer(editingTrainerId, {
      name: editForm.name,
      lastName: editForm.lastName,
      photoUrl: nextPhotoUrl,
      tags,
      bio: {ru: editForm.bioRu, en: editForm.bioRu}
    });

    if (!updated) {
      setEditError(
        isRu
          ? 'Заполните имя, фамилию, описание и загрузите фото файлом.'
          : 'Fill name, last name, bio, and upload a photo file.'
      );
      return;
    }

    const updatedName = getTrainerFullName(updated);
    setMessage(isRu ? `Тренер ${updatedName} обновлен.` : `Trainer ${updatedName} updated.`);
    closeEditModal();
  };

  const onDeleteFromEdit = () => {
    if (!editingTrainerId) return;
    if (editingLinkedSessions > 0) {
      setEditError(
        isRu ? 'Нельзя удалить тренера: есть связанные занятия.' : 'Cannot remove trainer: linked sessions exist.'
      );
      return;
    }

    const trainerName = trainers.find((item) => item.id === editingTrainerId);
    const trainerLabel = trainerName ? getTrainerFullName(trainerName) : editingTrainerId;
    removeTrainer(editingTrainerId);
    setMessage(isRu ? `Тренер ${trainerLabel} удален.` : `Trainer ${trainerLabel} removed.`);
    closeEditModal();
  };

  const onDetachSessionsFromEdit = async () => {
    if (!editingTrainerId) return;
    setEditError(null);
    setMessage(null);

    const linked = sessions.filter((session) => session.trainerId === editingTrainerId);
    if (linked.length === 0) {
      setEditError(isRu ? 'У тренера нет связанных занятий.' : 'Trainer has no linked sessions.');
      return;
    }

    const nextSessions = sessions.map((session) =>
      session.trainerId === editingTrainerId
        ? {
            ...session,
            trainerId: '',
            trainerDetached: true
          }
        : session
    );

    const saveResult = await replaceSessions(nextSessions);
    if (!saveResult.ok) {
      setEditError(
        isRu
          ? `Не удалось сохранить изменения расписания: ${saveResult.error}`
          : `Unable to save schedule changes: ${saveResult.error}`
      );
      return;
    }
    setMessage(
      isRu
        ? `Отвязано занятий: ${linked.length}. Они помечены красным в расписании.`
        : `Detached sessions: ${linked.length}. They are marked red in schedule.`
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card className="p-5">
        <h4 className="text-lg font-semibold">{isRu ? 'Новый тренер' : 'New trainer'}</h4>
        <p className="mt-2 text-sm text-text-muted">
          {isRu
            ? 'Поля используются в карточках тренеров, окне профиля и расписании.'
            : 'Fields are used by trainer cards, profile drawer, and schedule.'}
        </p>

        <div className="mt-4 space-y-3">
          <label className="block text-xs font-semibold">
            {isRu ? 'Имя тренера' : 'Trainer name'}
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm((prev) => ({...prev, name: event.target.value}))}
              className="mt-1 w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-semibold">
            {isRu ? 'Фамилия тренера' : 'Trainer last name'}
            <input
              type="text"
              value={form.lastName}
              onChange={(event) => setForm((prev) => ({...prev, lastName: event.target.value}))}
              className="mt-1 w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm"
            />
          </label>

          <label className="block text-xs font-semibold">
            {isRu ? 'Теги (через запятую)' : 'Tags (comma separated)'}
            <input
              type="text"
              value={form.tagsRaw}
              onChange={(event) => setForm((prev) => ({...prev, tagsRaw: event.target.value}))}
              placeholder="Rhythm, Beginner, Technique"
              className="mt-1 w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm"
            />
          </label>

          <label className="block text-xs font-semibold">
            Bio RU
            <textarea
              value={form.bioRu}
              onChange={(event) => setForm((prev) => ({...prev, bioRu: event.target.value}))}
              className="mt-1 min-h-[70px] w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm"
            />
          </label>

          <label className="block text-xs font-semibold">
            {isRu ? 'Фото (загрузка файла)' : 'Photo (file upload)'}
            <input type="file" accept="image/*" onChange={onPhotoFileChange} className="mt-1 block w-full text-sm" />
          </label>

          {form.photoFileDataUrl && (
            <div className="overflow-hidden rounded-md border border-border">
              <img src={form.photoFileDataUrl} alt={form.name || 'Trainer preview'} className="h-44 w-full object-cover" />
            </div>
          )}
        </div>

        {isLoadingPhoto && <p className="mt-3 text-xs text-text-muted">{isRu ? 'Загрузка фото...' : 'Loading photo...'}</p>}
        {error && <p className="mt-3 text-xs font-semibold text-state-danger">{error}</p>}
        {message && <p className="mt-3 text-xs font-semibold text-state-success">{message}</p>}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={onCreateTrainer}>{isRu ? 'Добавить тренера' : 'Add trainer'}</Button>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-lg font-semibold">{isRu ? 'Текущие тренеры' : 'Current trainers'}</h4>
          <div className="text-sm text-text-muted">{isRu ? `Всего: ${trainers.length}` : `Total: ${trainers.length}`}</div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {trainers.map((trainer) => {
            const linkedSessions = sessionCountByTrainer.get(trainer.id) ?? 0;
            const fullName = getTrainerFullName(trainer);

            return (
              <div
                key={trainer.id}
                className="h-[300px] w-[400px] max-w-full rounded-xl border border-border bg-bg-tertiary/40 p-3 xl:h-[420px] xl:w-[560px] 2xl:h-[460px] 2xl:w-[620px]"
              >
                <div className="flex h-full gap-3">
                  <div className="h-full w-[190px] shrink-0 overflow-hidden rounded-lg border border-border xl:w-[270px] 2xl:w-[300px]">
                    <img src={trainer.photoUrl} alt={fullName} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="truncate text-base font-semibold">{fullName}</div>
                    <div className="truncate text-sm text-text-muted">{trainer.id}</div>
                    <div className="mt-2 text-sm text-text-muted">{isRu ? `Тегов: ${trainer.tags.length}` : `Tags: ${trainer.tags.length}`}</div>
                    <div className="text-sm text-text-muted">{isRu ? `Занятий: ${linkedSessions}` : `Sessions: ${linkedSessions}`}</div>
                    <div className="mt-auto">
                      <Button variant="secondary" className="h-9 w-full px-3 text-sm" onClick={() => openEditModal(trainer)}>
                        {isRu ? 'Редактировать' : 'Edit'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Modal
        open={Boolean(editingTrainerId)}
        onClose={closeEditModal}
        title={isRu ? 'Редактирование тренера' : 'Edit trainer'}
        className="max-w-4xl xl:max-w-5xl"
      >
        <div className="grid gap-4 md:grid-cols-[1fr_290px]">
          <div className="space-y-3">
            <label className="block text-xs font-semibold">
              {isRu ? 'Имя тренера' : 'Trainer name'}
              <input
                type="text"
                value={editForm.name}
                onChange={(event) => setEditForm((prev) => ({...prev, name: event.target.value}))}
                className="mt-1 w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs font-semibold">
              {isRu ? 'Фамилия тренера' : 'Trainer last name'}
              <input
                type="text"
                value={editForm.lastName}
                onChange={(event) => setEditForm((prev) => ({...prev, lastName: event.target.value}))}
                className="mt-1 w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm"
              />
            </label>

            <label className="block text-xs font-semibold">
              {isRu ? 'Теги (через запятую)' : 'Tags (comma separated)'}
              <input
                type="text"
                value={editForm.tagsRaw}
                onChange={(event) => setEditForm((prev) => ({...prev, tagsRaw: event.target.value}))}
                className="mt-1 w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm"
              />
            </label>

            <label className="block text-xs font-semibold">
              Bio RU
              <textarea
                value={editForm.bioRu}
                onChange={(event) => setEditForm((prev) => ({...prev, bioRu: event.target.value}))}
                className="mt-1 min-h-[120px] w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm"
              />
            </label>

          </div>

          <div className="space-y-3">
            <label className="block text-xs font-semibold">
              {isRu ? 'Фото (загрузка файла)' : 'Photo (file upload)'}
              <input type="file" accept="image/*" onChange={onEditPhotoFileChange} className="mt-1 block w-full text-sm" />
            </label>

            {(editForm.photoFileDataUrl || editForm.currentPhotoUrl) && (
              <div className="aspect-[3/4] overflow-hidden rounded-md border border-border">
                <img
                  src={editForm.photoFileDataUrl || editForm.currentPhotoUrl}
                  alt={editForm.name || 'Trainer preview'}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {isLoadingEditPhoto && <p className="mt-3 text-xs text-text-muted">{isRu ? 'Загрузка фото...' : 'Loading photo...'}</p>}
        {editingLinkedSessions > 0 && (
          <p className="mt-3 text-xs text-text-muted">
            {isRu ? `У тренера ${editingLinkedSessions} связанных занятий.` : `Trainer has ${editingLinkedSessions} linked sessions.`}
          </p>
        )}
        {editError && <p className="mt-3 text-xs font-semibold text-state-danger">{editError}</p>}

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onDetachSessionsFromEdit} className="text-state-danger">
            {isRu ? 'Отвязать тренировки' : 'Detach sessions'}
          </Button>
          <Button variant="secondary" onClick={onDeleteFromEdit} className="border-state-danger/50 text-state-danger">
            {isRu ? 'Удалить' : 'Delete'}
          </Button>
          <Button onClick={onSaveEdit}>{isRu ? 'Сохранить' : 'Save'}</Button>
        </div>
      </Modal>
    </div>
  );
}
