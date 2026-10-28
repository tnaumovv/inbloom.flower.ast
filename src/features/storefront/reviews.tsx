import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { siteConfig } from '@/config/site';

// Manually verified against the live 2GIS listing on 2026-10-28.
// Short verbatim excerpts; the links lead to the complete source reviews.
const reviews = [
  { author: 'Давид Аряев', initials: 'ДА', date: '2026-09-25', label: '25 сентября 2026', quote: 'Собрали прелестный, свежий букет, который так понравился получательнице.' },
  { author: 'Асель Бекбосынова', initials: 'АБ', date: '2026-07-12', label: '12 июля 2026', quote: 'собрали очень красивый букет😍 супер быстро, классное обслуживание 🙌🏻' },
] as const;

export function ReviewsSection() {
  return <section className="container section reviews-section" id="reviews" aria-labelledby="reviews-heading">
    <div className="section-title"><h2 className="display" id="reviews-heading">Покупатели о нас</h2></div>
    <div className="reviews-grid">
      <article className="review-card review-summary">
        <div className="review-badge review-rating"><strong>5,0</strong><span>в 2ГИС</span></div>
        <div className="review-card-heading"><h3>160 оценок</h3><p>На 28 октября 2026</p></div>
        <p className="review-copy">Впечатления покупателей о букетах, работе флористов и доставке. Здесь — короткие цитаты из отзывов. Все отзывы и актуальный рейтинг доступны в 2ГИС.</p>
        <Link className="text-link" href={siteConfig.reviewsUrl} target="_blank" rel="noopener noreferrer">Все отзывы в 2ГИС <ArrowUpRight size={16} aria-hidden="true" /></Link>
      </article>
      {reviews.map(review => <article className="review-card" key={review.author}>
        <div className="review-badge review-initials" aria-hidden="true">{review.initials}</div>
        <div className="review-card-heading"><h3>{review.author}</h3><time dateTime={review.date}>{review.label}</time></div>
        <blockquote className="review-copy">«{review.quote}»</blockquote>
        <Link className="text-link" href={siteConfig.reviewsUrl} target="_blank" rel="noopener noreferrer" aria-label={`Читать отзыв ${review.author} в 2ГИС`}>Читать в 2ГИС <ArrowUpRight size={16} aria-hidden="true" /></Link>
      </article>)}
    </div>
  </section>;
}
