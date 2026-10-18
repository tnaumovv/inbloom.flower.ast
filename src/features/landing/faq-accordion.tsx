'use client';

import { useSyncExternalStore } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { FaqItem } from './faq-data';
import styles from './faq.module.css';

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

function Answer({ item }: { item: FaqItem }) {
  return <><p>{item.answer}</p>{item.link && <a className={styles.answerLink} href={item.link.href} target="_blank" rel="noopener noreferrer">{item.link.label}</a>}</>;
}

export function FaqAccordion({ items }: { items: readonly FaqItem[] }) {
  const hydrated = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Native disclosures preserve every answer before hydration and without JavaScript.
  if (!hydrated) return <div className={styles.list}>{items.map((item, index) => (
    <details key={item.id} open={index === 0} className={styles.nativeItem}>
      <summary className={styles.trigger}>{item.question}</summary>
      <div className={styles.answer}><Answer item={item}/></div>
    </details>
  ))}</div>;

  return <Accordion type="single" collapsible defaultValue="order" className={styles.list}>
    {items.map(item => <AccordionItem key={item.id} value={item.id} className={styles.item}>
      <AccordionTrigger className={styles.trigger}>{item.question}</AccordionTrigger>
      <AccordionContent className={styles.answer}><Answer item={item}/></AccordionContent>
    </AccordionItem>)}
  </Accordion>;
}
