import { Container } from '@/components/ui/container';
import { Icon } from '@/components/ui/icon';

const steps = [
  {
    id: 'bouquet',
    title: 'Выберите букет',
    description: 'Найдите свою композицию',
  },
  {
    id: 'chat',
    title: 'Напишите в WhatsApp',
    description: 'Свяжитесь с флористом',
  },
  {
    id: 'details',
    title: 'Согласуйте детали',
    description: 'Состав, оплату и получение',
  },
] as const;

export function OrderSteps() {
  return <section id="how-to-order" className="order-steps" aria-labelledby="steps-title"><Container>
    <h2 id="steps-title" data-reveal>Как заказать</h2>
    <fieldset className="order-steps-fieldset">
      <legend className="sr-only">Три шага заказа</legend>
      <ol className="order-steps-list" aria-label="Как заказать">{steps.map((step, index) => <li key={step.id} className="step-option">
        <input className="sr-only step-radio" type="radio" id={`order-step-${step.id}`} name="order-guide-step" defaultChecked={index === 0} aria-label={`Шаг ${index + 1}: ${step.title}`} aria-describedby={`order-description-${step.id}`}/>
        <label className="step-label" htmlFor={`order-step-${step.id}`} data-reveal>
          <span className="step-badge" aria-hidden="true"><span className="step-number">{index + 1}</span><Icon name="check" className="step-check"/></span>
          <span className="step-copy"><span className="step-title">{step.title}</span><span id={`order-description-${step.id}`} className="step-description">{step.description}</span></span>
        </label>
      </li>)}</ol>

    </fieldset>
  </Container></section>;
}
