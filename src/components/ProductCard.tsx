import React from 'react';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { DomeggookItem } from '@/types/domeggook';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  item: DomeggookItem;
  onSelect: (item: DomeggookItem) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ item, onSelect }) => {
  const formattedPrice = Number(item.price).toLocaleString();

  return (
    <div className={styles.card}>
      <div className={styles.imageArea}>
        <Image
          src={item.thumb}
          alt={item.title}
          fill
          className={styles.image}
          unoptimized // 도매꾹 이미지는 최적화 로더에서 에러날 수 있으므로 우선 unoptimized 처리
        />
      </div>
      <div className={styles.content}>
        <h3 className={styles.title} title={item.title}>
          {item.title}
        </h3>
        <div className={styles.priceInfo}>
          <span className={styles.price}>{formattedPrice}</span>
          <span className={styles.priceUnit}>원</span>
        </div>
        <div className={styles.meta}>
          판매자: {item.id} | 최소수량: {item.unitQty}개
        </div>
        <div className={styles.actionButtons}>
          <button className={styles.actionButton} onClick={() => onSelect(item)}>
            상세페이지 생성
          </button>
          <a 
            href={item.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.linkButton}
            title="도매꾹 상품 페이지로 이동"
          >
            <ExternalLink size={20} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
