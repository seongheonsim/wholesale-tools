import React from 'react';
import { DomeggookItem } from '@/types/domeggook';

interface DetailTemplateProps {
  item: DomeggookItem;
  id?: string;
}

const DetailTemplate: React.FC<DetailTemplateProps> = ({ item, id }) => {
  const formattedPrice = Number(item.price).toLocaleString();

  return (
    <div 
      id={id} 
      style={{
        width: '860px', // 스마트스토어 가로 권장 사이즈
        backgroundColor: '#ffffff',
        padding: '60px 40px',
        margin: '0 auto',
        fontFamily: 'sans-serif',
        color: '#222',
        lineHeight: '1.6',
        boxSizing: 'border-box'
      }}
    >
      {/* Header / Intro */}
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h2 style={{ fontSize: '24px', color: '#007bff', marginBottom: '10px' }}>SPECIAL PRICE</h2>
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', margin: '0 0 20px 0' }}>{item.title}</h1>
        <div style={{ height: '4px', width: '60px', backgroundColor: '#333', margin: '0 auto' }}></div>
      </div>

      {/* Main Product Image */}
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <img 
          src={item.thumb} 
          alt={item.title} 
          crossOrigin="anonymous"
          style={{ maxWidth: '100%', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} 
        />
      </div>

      {/* Price Section */}
      <div style={{ 
        backgroundColor: '#f9f9f9', 
        padding: '30px', 
        borderRadius: '12px', 
        textAlign: 'center',
        marginBottom: '50px' 
      }}>
        <p style={{ fontSize: '18px', color: '#666', marginBottom: '10px' }}>판매가</p>
        <p style={{ fontSize: '48px', fontWeight: 'bold', color: '#d32323', margin: '0' }}>
          {formattedPrice}<span style={{ fontSize: '24px', marginLeft: '5px' }}>원</span>
        </p>
      </div>

      {/* Trust Points */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '50px' }}>
        <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>품질 보증</h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>정식 도매 유통 경로를 통해<br/>공급되는 믿을 수 있는 상품입니다.</p>
        </div>
        <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>신속 배송</h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>주문 확인 후 신속하게<br/>발송 처리를 도와드립니다.</p>
        </div>
      </div>

      {/* Info Section */}
      <div style={{ borderTop: '2px solid #333', paddingTop: '40px' }}>
        <h3 style={{ fontSize: '22px', marginBottom: '20px' }}>PRODUCT INFO</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <th style={{ textAlign: 'left', padding: '15px', backgroundColor: '#fcfcfc', width: '30%' }}>상품번호</th>
              <td style={{ padding: '15px' }}>{item.no}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <th style={{ textAlign: 'left', padding: '15px', backgroundColor: '#fcfcfc' }}>최소구매수량</th>
              <td style={{ padding: '15px' }}>{item.unitQty}개</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <th style={{ textAlign: 'left', padding: '15px', backgroundColor: '#fcfcfc' }}>공급사</th>
              <td style={{ padding: '15px' }}>{item.id}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '80px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
        <p>본 상세페이지는 정보 제공을 위해 생성되었습니다.</p>
        <p>© 2024 Lowest Price Platform</p>
      </div>
    </div>
  );
};

export default DetailTemplate;
