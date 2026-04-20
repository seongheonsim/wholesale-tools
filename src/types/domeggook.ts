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

// 실제 v4.5 getItemView 전체 응답 구조에 맞춘 인터페이스
export interface DomeggookItemDetail {
  basis: {
    no: number | string;
    status: string;
    title: string;
    keywords?: { kw: string[] };
    section: string;
    nego: string;
    adult: string;
    dateStart: string;
    dateEnd: string;
    dateReg: string;
    secretItem: string;
    tax: string;
  };
  price: {
    dome: string;
  };
  qty: {
    inventory: string;
    domeMoq: string;
    domeUnit: number | string;
  };
  deli: {
    method: string;
    pay: string;
    dome: {
      type: string;
      tbl: string;
    };
    supply: {
      type: string;
      tbl: string;
    };
    wating: string;
    periodDeli: string;
    sendAvg: string;
    fastDeli: string;
    merge: { enable: string };
    feeExtra: {
      jeju: string;
      islands: string;
      useDeliPro: string;
    };
    fromOversea: string;
    reqCcno: string;
  };
  thumb: {
    small: string;
    large: string;
    original: string;
    smallPng: string;
    largePng: string;
  };
  desc: {
    license: { usable: string; msg: string };
    contents: { item: string };
  };
  seller: {
    id: string;
    nick: string;
    type: string;
    rank: string;
    power: string;
    good: string;
    global: string;
    score: { avg: string; cnt: number | string };
    company: {
      name: string;
      boss: string;
      cno: string;
      addr: string;
      phone: string;
    };
  };
  detail: {
    size: string;
    weight: string;
    country: string;
    manufacturer: string;
    model: string;
    oversea: string;
    infoDuty: {
      type: string;
      item: Array<{ name: string; desc: string }>;
    };
  };
  category: {
    parents: { elem: Array<{ name: string; code: string; depth: number }> };
    current: { name: string; code: string; depth: number };
  };
  return: {
    addr: {
      address1: string;
      address2: string;
      phone: string;
    };
    deliAmt: number | string;
  };
  selectOpt?: string; // JSON String
}

export interface DomeggookItemDetailResponse {
  domeggook: DomeggookItemDetail;
}
