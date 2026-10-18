import { Container } from '@/components/ui/container';
import { Icon } from '@/components/ui/icon';
import { buildWhatsAppLink } from '@/features/contact/whatsapp';

const steps = [
  {
    id: 'bouquet',
    title: 'Выберите букет',
    description: 'Найдите свою композицию',
    panel: {
      heading: 'Начните с букета',
      content: 'Посмотрите витрину или расскажите флористу о поводе, любимых цветах и бюджете. Наличие и состав понравившегося букета уточните в переписке.',
      action: 'Перейти к витрине',
      href: '#bouquets',
      external: false,
    },
  },
  {
    id: 'chat',
    title: 'Напишите в WhatsApp',
    description: 'Свяжитесь с флористом',
    panel: {
      heading: 'Расскажите о вашем поводе',
      content: 'Нажмите «Заказать в WhatsApp» в карточке букета — откроется чат с названием и ценой. Отправьте сообщение и добавьте свои пожелания.',
      action: 'Открыть WhatsApp',
      href: buildWhatsAppLink(),
      external: true,
    },
  },
  {
    id: 'details',
    title: 'Согласуйте детали',
    description: 'Состав, оплату и получение',
    panel: null,
  },
] as const;

export function OrderSteps() {
  return <section id="how-to-order" className="order-steps" aria-labelledby="steps-title"><Container>
    <h2 id="steps-title">Как заказать</h2>
    <fieldset className="order-steps-fieldset">
      <legend className="sr-only">Три шага заказа</legend>
      <ol className="order-steps-list" aria-label="Как заказать">{steps.map((step, index) => <li key={step.id} className="step-option">
        <input className="sr-only step-radio" type="radio" id={`order-step-${step.id}`} name="order-guide-step" defaultChecked={index === 0} aria-label={`Шаг ${index + 1}: ${step.title}`} aria-describedby={`order-description-${step.id}`} aria-controls={step.panel ? `order-panel-${step.id}` : undefined}/>
        <label className="step-label" htmlFor={`order-step-${step.id}`}>
          <span className="step-badge" aria-hidden="true"><span className="step-number">{index + 1}</span><Icon name="check" className="step-check"/></span>
          <span className="step-copy"><span className="step-title">{step.title}</span><span id={`order-description-${step.id}`} className="step-description">{step.description}</span></span>
        </label>
      </li>)}</ol>
      <div className="step-panels">{steps.map(step => step.panel && <section key={step.id} id={`order-panel-${step.id}`} className={`step-panel step-panel--${step.id}`} aria-labelledby={`order-heading-${step.id}`}>
        <h3 id={`order-heading-${step.id}`}>{step.panel.heading}</h3>
        <p>{step.panel.content}</p>
        <a className="step-panel-link" href={step.panel.href} target={step.panel.external ? '_blank' : undefined} rel={step.panel.external ? 'noopener noreferrer' : undefined}>{step.panel.action}<Icon name={step.panel.external ? 'arrow-up-right' : 'arrow-right'}/></a>
      </section>)}</div>
    </fieldset>
  </Container></section>;
}
