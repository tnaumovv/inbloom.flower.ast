import { Container } from '@/components/ui/container';

const steps = ['Выберите букет', 'Напишите в WhatsApp', 'Согласуйте детали'];

export function OrderSteps() {
  return <section className="order-steps" aria-labelledby="steps-title"><Container>
    <h2 id="steps-title">Как заказать</h2>
    <ol aria-label="Как заказать">{steps.map((text, index) => <li key={text}><span className="step-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><span>{text}</span></li>)}</ol>
  </Container></section>;
}
