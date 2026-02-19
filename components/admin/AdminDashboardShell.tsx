'use client';

import {useState} from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {Locale} from '@/lib/locale';
import AdminSessionPoolManager from '@/components/admin/AdminSessionPoolManager';
import AdminTrainerManager from '@/components/admin/AdminTrainerManager';

type SectionKey = 'schedule' | 'trainers';

export default function AdminDashboardShell({locale}: {locale: Locale}) {
  const isRu = locale === 'ru';
  const [activeSection, setActiveSection] = useState<SectionKey>('schedule');

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h4 className="text-lg font-semibold">{isRu ? 'Расписание' : 'Schedule'}</h4>
          <p className="mt-2 text-sm text-text-muted">
            {isRu ? 'Ручное создание занятий через матрицу.' : 'Manual session creation via matrix editor.'}
          </p>
          <Button
            variant={activeSection === 'schedule' ? 'primary' : 'secondary'}
            className="mt-4"
            onClick={() => setActiveSection('schedule')}
          >
            {isRu ? 'Расписание' : 'Schedule'}
          </Button>
        </Card>

        <Card>
          <h4 className="text-lg font-semibold">{isRu ? 'Тренеры' : 'Trainers'}</h4>
          <p className="mt-2 text-sm text-text-muted">
            {isRu ? 'Добавление и удаление тренеров с фото и bio.' : 'Add and remove trainers with photo and bio.'}
          </p>
          <Button
            variant={activeSection === 'trainers' ? 'primary' : 'secondary'}
            className="mt-4"
            onClick={() => setActiveSection('trainers')}
          >
            {isRu ? 'Тренеры' : 'Trainers'}
          </Button>
        </Card>
      </div>

      {activeSection === 'schedule' && <AdminSessionPoolManager locale={locale} />}

      {activeSection === 'trainers' && <AdminTrainerManager locale={locale} />}
    </div>
  );
}
