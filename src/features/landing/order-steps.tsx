import { Container } from '@/components/ui/container';
import { Icon } from '@/components/ui/icon';
import { buildWhatsAppLink } from '@/features/contact/whatsapp';

const steps = [
  {
    id: 'bouquet',
    title: 'Выберите букет',
    description: 'Найдите свою композицию',
    heading: 'Начните с букета',
    content: 'Посмотрите витрину или расскажите флористу о поводе, любимых цветах и бюджете. Наличие и состав понравившегося букета уточните в переписке.',
    action: 'Перейти к витрине',
    href: '#bouquets',
    external: false,
  },
  {
    id: 'chat',
    title: 'Напишите в WhatsApp',
    description: 'Свяжитесь с флористом',
    heading: 'Расскажите о вашем поводе',
    content: 'Нажмите «Заказать в WhatsApp» в карточке букета — откроется чат с названием и ценой. Отправьте сообщение и добавьте свои пожелания.',
    action: 'Открыть WhatsApp',
    href: buildWhatsAppLink(),
    external: true,
  },
  {
    id: 'details',
    title: 'Согласуйте детали',
    description: 'Состав, оплату и получение',
    heading: 'Обсудите всё с флористом',
    content: 'Согласуйте состав и итоговую стоимость, способ оплаты, адрес и желаемое время доставки или визита в магазин. Возможность получения к этому времени подтвердит флорист.',
    action: 'Обсудить детали',
    href: buildWhatsAppLink('Здравствуйте! Хочу согласовать детали заказа букета: состав, стоимость и получение.'),
    external: true,
  },
] as const;

export function OrderSteps() {
  return <section id="how-to-order" className="order-steps" aria-labelledby="steps-title"><Container>
    <h2 id="steps-title">Как заказать</h2>
    <fieldset className="order-steps-fieldset">
      <legend className="sr-only">Три шага заказа</legend>
      <ol className="order-steps-list" aria-label="Как заказать">{steps.map((step, index) => <li key={step.id} className="step-option">
        <input className="sr-only step-radio" type="radio" id={`order-step-${step.id}`} name="order-guide-step" defaultChecked={index === 0} aria-label={`Шаг ${index + 1}: ${step.title}`} aria-describedby={`order-description-${step.id}`} aria-controls={`order-panel-${step.id}`}/>
        <label className="step-label" htmlFor={`order-step-${step.id}`}>
          <span className="step-badge" aria-hidden="true"><span className="step-number">{index + 1}</span><Icon name="check" className="step-check"/></span>
          <span className="step-copy"><span className="step-title">{step.title}</span><span id={`order-description-${step.id}`} className="step-description">{step.description}</span></span>
        </label>
      </li>)}</ol>
      <div className="step-panels">{steps.map(step => <section key={step.id} id={`order-panel-${step.id}`} className={`step-panel step-panel--${step.id}`} aria-labelledby={`order-heading-${step.id}`}>
        <h3 id={`order-heading-${step.id}`}>{step.heading}</h3>
        <p>{step.content}</p>
        <a className="step-panel-link" href={step.href} target={step.external ? '_blank' : undefined} rel={step.external ? 'noopener noreferrer' : undefined}>{step.action}<Icon name={step.external ? 'arrow-up-right' : 'arrow-right'}/></a>
      </section>)}</div>
    </fieldset>
  </Container></section>;
}
