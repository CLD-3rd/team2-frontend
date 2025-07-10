// 인증 관련 유틸리티 함수들

// 토큰 저장
export const setAuthToken = (token) => {
  localStorage.setItem('authToken', token)
}

// 토큰 가져오기
export const getAuthToken = () => {
  return localStorage.getItem('authToken')
}

// 토큰 삭제
export const removeAuthToken = () => {
  localStorage.removeItem('authToken')
}

// 사용자 ID 저장
export const setUserId = (userId) => {
  localStorage.setItem('userId', userId)
}

// 사용자 ID 가져오기
export const getUserId = () => {
  return localStorage.getItem('userId')
}

// 사용자 ID 삭제
export const removeUserId = () => {
  localStorage.removeItem('userId')
}

// 로그인 상태 확인
export const isAuthenticated = () => {
  return !!getAuthToken()
}

// 로그아웃
export const logout = () => {
  removeAuthToken()
  removeUserId()
  // 필요한 경우 다른 정리 작업 수행
}

// 토큰 만료 확인 (JWT 토큰의 경우)
export const isTokenExpired = (token) => {
  if (!token) return true
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 < Date.now()
  } catch (error) {
    return true
  }
} 