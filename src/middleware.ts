import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/jwt';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const isLoginPage = request.nextUrl.pathname === '/login';

  let isValidToken = false;
  if (token) {
    const payload = await verifyToken(token);
    if (payload) {
      isValidToken = true;
    }
  }

  // 1. 로그인 페이지 진입 시 로그인 토큰이 존재하고 유효한 경우 메인 페이지로 이동
  if (isLoginPage && isValidToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // API 라우트나 정적 파일 등은 검사 제외
  const isProtectedRoute = 
    !isLoginPage && 
    !request.nextUrl.pathname.startsWith('/api') && 
    !request.nextUrl.pathname.startsWith('/_next') && 
    !request.nextUrl.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico)$/);

  // 2. 보호된 페이지에 접근 시 토큰이 없거나 유효하지 않은 경우 만료/삭제하고 로그인 페이지로 이동
  if (isProtectedRoute && !isValidToken) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    if (token) {
      response.cookies.delete('auth_token');
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
