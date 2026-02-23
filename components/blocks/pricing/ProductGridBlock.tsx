'use client';

import {useMemo, useState} from 'react';
import {useSession} from 'next-auth/react';
import {products} from '@/lib/constants/catalog';
import {t} from '@/lib/utils/localized';
import {Locale} from '@/lib/locale';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import {useToast} from '@/components/ui/Toast';

type PurchaseState = 'idle' | 'processing' | 'success' | 'error';

export default function ProductGridBlock({
  sectionTitle: _sectionTitle,
  type,
  locale
}: {
  sectionTitle: string;
  type: 'plan' | 'certificate' | 'single';
  locale: Locale;
}) {
  const list = products.filter((product) => product.type === type);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [purchaseState, setPurchaseState] = useState<PurchaseState>('idle');
  const [purchaseError, setPurchaseError] = useState('');
  const [remainingSessions, setRemainingSessions] = useState<number | null>(null);
  const {status: authStatus} = useSession();
  const {addToast} = useToast();
  const selectedProduct = useMemo(
    () => list.find((product) => product.id === selectedProductId) ?? null,
    [list, selectedProductId]
  );

  const isRu = locale === 'ru';
  const formatPrice = (price: number) => `${price.toLocaleString(isRu ? 'ru-RU' : 'en-US')}`;
  const buyLabel = isRu ? '\u041A\u0443\u043F\u0438\u0442\u044C' : 'Buy';
  const paymentTitle = isRu ? '\u041E\u043F\u043B\u0430\u0442\u0430' : 'Payment';
  const placeholderText = isRu
    ? '\u0417\u0434\u0435\u0441\u044C \u0431\u0443\u0434\u0435\u0442 \u0444\u043E\u0440\u043C\u0430 \u044D\u043A\u0432\u0430\u0439\u0440\u0438\u043D\u0433\u0430. \u041F\u043E\u043A\u0430 \u0440\u0430\u0437\u0434\u0435\u043B \u043E\u043F\u043B\u0430\u0442\u044B \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u043A\u0430\u043A \u0437\u0430\u0433\u043B\u0443\u0448\u043A\u0430.'
    : 'This is a payment acquiring placeholder. The checkout form will be added later.';
  const selectedLabel = isRu
    ? '\u0412\u044B \u0432\u044B\u0431\u0440\u0430\u043B\u0438'
    : 'Selected product';
  const purchaseStubSuccessText = isRu
    ? '\u041F\u043B\u0430\u0442\u0435\u0436\u043D\u044B\u0439 \u043C\u043E\u0434\u0443\u043B\u044C \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u043A\u0430\u043A \u0437\u0430\u0433\u043B\u0443\u0448\u043A\u0430. \u041E\u043F\u043B\u0430\u0442\u0430 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043F\u0440\u043E\u0448\u043B\u0430.'
    : 'Payment module works as a stub. Payment was completed successfully.';
  const purchaseInProgressText = isRu
    ? '\u0418\u043C\u0438\u0442\u0438\u0440\u0443\u0435\u043C \u043E\u043F\u043B\u0430\u0442\u0443...'
    : 'Processing stub payment...';
  const closeLabel = isRu ? '\u0417\u0430\u043A\u0440\u044B\u0442\u044C' : 'Close';
  const authRequiredText = isRu
    ? 'Для покупки нужно войти в аккаунт.'
    : 'Please sign in to complete purchase.';
  const creditsLabel = (credits: number) => {
    if (!isRu) return `${credits} credits`;

    const mod10 = credits % 10;
    const mod100 = credits % 100;
    const word =
      mod10 === 1 && mod100 !== 11
        ? '\u043F\u043E\u0441\u0435\u0449\u0435\u043D\u0438\u0435'
        : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
          ? '\u043F\u043E\u0441\u0435\u0449\u0435\u043D\u0438\u044F'
          : '\u043F\u043E\u0441\u0435\u0449\u0435\u043D\u0438\u0439';

    return `${credits} ${word}`;
  };

  const resetModal = () => {
    setSelectedProductId(null);
    setPurchaseState('idle');
    setPurchaseError('');
    setRemainingSessions(null);
  };

  const purchaseProduct = async (productId: string) => {
    setSelectedProductId(productId);
    setPurchaseState('processing');
    setPurchaseError('');
    setRemainingSessions(null);

    if (authStatus !== 'authenticated') {
      setPurchaseState('error');
      setPurchaseError(authRequiredText);
      return;
    }

    try {
      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({productId})
      });

      const payload = (await response.json().catch(() => null)) as
        | {ok?: boolean; reason?: string; remainingSessions?: number}
        | null;

      if (response.status === 401 || payload?.reason === 'unauthorized') {
        setPurchaseState('error');
        setPurchaseError(authRequiredText);
        return;
      }

      if (!response.ok || payload?.ok === false) {
        setPurchaseState('error');
        setPurchaseError(
          isRu
            ? '\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u0440\u043E\u0432\u0435\u0441\u0442\u0438 \u043E\u043F\u043B\u0430\u0442\u0443. \u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435 \u043F\u043E\u043F\u044B\u0442\u043A\u0443.'
            : 'Unable to complete payment. Please try again.'
        );
        return;
      }

      setRemainingSessions(typeof payload?.remainingSessions === 'number' ? payload.remainingSessions : null);
      setPurchaseState('success');
      addToast({
        tone: 'success',
        title: isRu ? '\u041E\u043F\u043B\u0430\u0442\u0430 \u043F\u0440\u043E\u0448\u043B\u0430' : 'Payment completed',
        description: isRu
          ? '\u0422\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0438 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u044B \u0432 \u0432\u0430\u0448 \u0430\u043A\u043A\u0430\u0443\u043D\u0442.'
          : 'Sessions were added to your account.'
      });
    } catch (error) {
      console.error('Unable to process purchase.', error);
      setPurchaseState('error');
      setPurchaseError(
        isRu
          ? '\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u0440\u043E\u0432\u0435\u0441\u0442\u0438 \u043E\u043F\u043B\u0430\u0442\u0443. \u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435 \u043F\u043E\u043F\u044B\u0442\u043A\u0443.'
          : 'Unable to complete payment. Please try again.'
      );
    }
  };

  return (
    <>
      <section className="container-wide">
        <div className="grid items-stretch gap-6 md:grid-cols-3">
          {list.map((product) => (
            <Card key={product.id} className="flex h-full min-h-[220px] flex-col">
              <h4 className="text-lg font-semibold">{t(product.name, locale)}</h4>
              <p className="mt-3 line-clamp-3 text-sm text-text-muted">{t(product.description, locale)}</p>
              <div className="mt-4 text-xs text-text-muted">
                {product.credits ? creditsLabel(product.credits) : '\u00A0'}
              </div>
              <div className="mt-auto flex items-center justify-between pt-6">
                <span className="text-xl font-semibold">{formatPrice(product.price)}</span>
                <Button variant="secondary" onClick={() => void purchaseProduct(product.id)}>
                  {buyLabel}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <Modal
        open={Boolean(selectedProduct)}
        onClose={resetModal}
        title={paymentTitle}
      >
        <p className="text-sm text-text-muted">{placeholderText}</p>
        {selectedProduct && (
          <div className="mt-4 rounded-xl border border-border bg-bg-secondary p-4">
            <div className="text-xs text-text-muted">{selectedLabel}</div>
            <div className="mt-1 text-sm font-semibold">{t(selectedProduct.name, locale)}</div>
            <div className="mt-1 text-sm text-text-muted">{formatPrice(selectedProduct.price)}</div>
            {purchaseState === 'processing' && (
              <div className="mt-3 text-sm text-text-muted">{purchaseInProgressText}</div>
            )}
            {purchaseState === 'success' && (
              <div className="mt-3 rounded-lg border border-state-success/40 bg-state-success/10 px-3 py-2 text-sm text-state-success">
                {purchaseStubSuccessText}
                {typeof remainingSessions === 'number' && (
                  <div className="mt-1 text-xs">
                    {isRu
                      ? `Остаток тренировок: ${remainingSessions}`
                      : `Remaining sessions: ${remainingSessions}`}
                  </div>
                )}
              </div>
            )}
            {purchaseState === 'error' && (
              <div className="mt-3 rounded-lg border border-state-danger/40 bg-state-danger/10 px-3 py-2 text-sm text-state-danger">
                {purchaseError}
              </div>
            )}
          </div>
        )}
        <div className="mt-6 flex justify-end">
          <Button onClick={resetModal}>{closeLabel}</Button>
        </div>
      </Modal>
    </>
  );
}
