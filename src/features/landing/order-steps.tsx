import { Container } from '@/components/ui/container';

const steps = ['Выберите букет', 'Напишите в WhatsApp', 'Согласуйте детали'];

export function OrderSteps() {
  return <section className="order-steps" aria-labelledby="steps-title"><Container>
    <h2 id="steps-title">Как заказать</h2>
    <ol aria-label="Как заказать">{steps.map(text => <li key={text}><span className="step-dot" aria-hidden="true"/><span>{text}</span></li>)}</ol>
  </Container></section>;
}
