'use client';

import {useMemo, useState} from 'react';
import {products} from '@/lib/constants/catalog';
import {t} from '@/lib/utils/localized';
import {Locale} from '@/lib/locale';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

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
  const closeLabel = isRu ? '\u0417\u0430\u043A\u0440\u044B\u0442\u044C' : 'Close';
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

  return (
    <>
      <section className="container-wide">
        <div className="grid gap-6 md:grid-cols-3">
          {list.map((product) => (
            <Card key={product.id}>
              <h4 className="text-lg font-semibold">{t(product.name, locale)}</h4>
              {product.id === 'p-start-cycle' && product.credits && (
                <div className="mt-4 text-xs text-text-muted">{creditsLabel(product.credits)}</div>
              )}
              <div className="mt-6 flex items-center justify-between">
                <span className="text-xl font-semibold">{formatPrice(product.price)}</span>
                <Button variant="secondary" onClick={() => setSelectedProductId(product.id)}>
                  {buyLabel}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <Modal
        open={Boolean(selectedProduct)}
        onClose={() => setSelectedProductId(null)}
        title={paymentTitle}
      >
        <p className="text-sm text-text-muted">{placeholderText}</p>
        {selectedProduct && (
          <div className="mt-4 rounded-xl border border-border bg-bg-secondary p-4">
            <div className="text-xs text-text-muted">{selectedLabel}</div>
            <div className="mt-1 text-sm font-semibold">{t(selectedProduct.name, locale)}</div>
            <div className="mt-1 text-sm text-text-muted">{formatPrice(selectedProduct.price)}</div>
          </div>
        )}
        <div className="mt-6 flex justify-end">
          <Button onClick={() => setSelectedProductId(null)}>{closeLabel}</Button>
        </div>
      </Modal>
    </>
  );
}
