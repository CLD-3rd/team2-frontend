import { getAuthToken, isTokenExpired } from './auth'

const API_BASE_URL = `${import.meta.env.VITE_SERVER_URL}/api`


// 기본 fetch 래퍼
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  // 토큰이 있다면 헤더에 추가
  const token = getAuthToken()
  if (token && !isTokenExpired(token)) {
    defaultOptions.headers.Authorization = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, defaultOptions)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('API Request failed:', error)
    throw error
  }
}

// 뮤지컬 관련 API
export const musicalAPI = {
  // 뮤지컬 목록 조회
  getMusicals: () => apiRequest('/musicals'),
  
  // 뮤지컬 상세 조회
  getMusical: (id) => apiRequest(`/musicals/${id}`),
  
  // 좌석 정보 조회
  getSeats: (musicalId, date) => apiRequest(`/musicals/${musicalId}/seats?date=${date}`),
  
  // 예약 생성
  createReservation: (data) => apiRequest('/reservations', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // 예약 확인
  getReservation: (id) => apiRequest(`/reservations/${id}`),
  
  // 예약 취소
  cancelReservation: (id) => apiRequest(`/reservations/${id}`, {
    method: 'DELETE',
  }),
}

// 사용자 관련 API
export const userAPI = {
  // 로그인
  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  
  // 회원가입
  register: (userData) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  
  // 사용자 정보 조회
  getProfile: () => apiRequest('/auth/profile'),
} 