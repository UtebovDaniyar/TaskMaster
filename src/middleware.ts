import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  
  // Публичные маршруты, которые не требуют аутентификации
  const publicPaths = ["/sign-in", "/sign-up", "/error"]
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  
  // API маршруты NextAuth
  const isAuthAPI = pathname.startsWith("/api/auth")
  
  // Статические файлы
  const isStaticFile = pathname.startsWith("/_next") || 
                      pathname.startsWith("/favicon") ||
                      pathname.includes(".")
  
  // Если это публичный путь, API аутентификации или статический файл, пропускаем
  if (isPublicPath || isAuthAPI || isStaticFile) {
    return NextResponse.next()
  }
  
  // Проверяем наличие сессии
  if (!req.auth?.user) {
    console.log("Нет сессии, перенаправляем на sign-in")
    const signInUrl = new URL("/sign-in", req.url)
    const response = NextResponse.redirect(signInUrl)
    
    // Очищаем все cookies при отсутствии сессии
    response.headers.set('Set-Cookie', 'next-auth.session-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT')
    
    return response
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
} 