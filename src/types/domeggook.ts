export interface DomeggookItem {
  no: string;
  title: string;
  thumb: string;
  id: string; // 판매자 ID
  price: string;
  unitQty: string; // 최소 구매 수량
  url: string; // 도매꾹 상품 상세페이지 URL
  deli: {
    who: string;
    fee: string;
    add: string;
    fromOversea: string;
  };
}

export interface DomeggookResponse {
  domeggook: {
    header?: {
      numberOfItems: string;
      firstItem: string;
      lastItem: string;
      currentPage: string;
      itemsPerPage: string;
      numberOfPages: string;
      sort: string;
    };
    list?: {
      item: DomeggookItem[] | DomeggookItem;
    };
  };
}

export interface SearchParams {
  kw?: string;
  ca?: string;
  sz?: number;
  pg?: number;
  so?: string;
  mnp?: number;
  mxp?: number;
  mnq?: number;
  mxq?: number;
  who?: string;
  id?: string;
  sgd?: boolean;
  fdl?: boolean;
  lwp?: boolean;
}
