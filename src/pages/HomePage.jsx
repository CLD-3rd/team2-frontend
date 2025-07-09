"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Grape, Clock, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import ReservationModal from "@/components/ReservationModal"

// 쿠키를 가져오는 유틸리티 함수
const getCookie = (name) => {
  try {
    const cookies = document.cookie.split(';').map(cookie => cookie.trim());
    console.log('All cookies:', cookies); // 디버깅용

    for (const cookie of cookies) {
      const [cookieName, cookieValue] = cookie.split('=');
      if (cookieName === name) {
        console.log(`Found ${name} cookie:`, cookieValue); // 디버깅용
        return cookieValue;
      }
    }
    console.log(`${name} cookie not found`); // 디버깅용
    return null;
  } catch (error) {
    console.error('Error reading cookie:', error);
    return null;
  }
}

const mockMusicals = [
  {
    id: 1,
    title: "The Phantom of the Opera",
    timeRange: "14:00 ~ 16:30",
    description: "A haunting tale of love, obsession, and music set in the mysterious depths of the Paris Opera House.",
    remainingSeats: 15,
    totalSeats: 50,
    price: 85000,
    posterUrl: "/placeholder.svg?height=200&width=150",
    isReserved: false,
  },
  {
    id: 2,
    title: "Hamilton",
    timeRange: "19:30 ~ 22:00",
    description:
      "The revolutionary musical about Alexander Hamilton, America's founding father, told through hip-hop and R&B.",
    remainingSeats: 3,
    totalSeats: 60,
    price: 120000,
    posterUrl: "/placeholder.svg?height=200&width=150",
    isReserved: true,
  },
  {
    id: 3,
    title: "The Lion King",
    timeRange: "15:00 ~ 17:30",
    description: "Disney's award-winning musical brings the African savanna to life with stunning costumes and music.",
    remainingSeats: 28,
    totalSeats: 80,
    price: 95000,
    posterUrl: "/placeholder.svg?height=200&width=150",
    isReserved: false,
  },
  {
    id: 4,
    title: "Wicked",
    timeRange: "20:00 ~ 22:45",
    description: "The untold story of the witches of Oz, exploring friendship, love, and the nature of good and evil.",
    remainingSeats: 0,
    totalSeats: 45,
    price: 110000,
    posterUrl: "/placeholder.svg?height=200&width=150",
    isReserved: false,
  },
  {
    id: 5,
    title: "Chicago",
    timeRange: "18:00 ~ 20:15",
    description: "A dazzling musical about fame, fortune, and murder in the jazz age of 1920s Chicago.",
    remainingSeats: 22,
    totalSeats: 55,
    price: 75000,
    posterUrl: "/placeholder.svg?height=200&width=150",
    isReserved: true,
  },
]

const mockUser = {
  name: "John Doe",
  email: "john.doe@example.com",
}

export default function HomePage() {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [activeSort, setActiveSort] = useState("latest")
  const [musicals, setMusicals] = useState(mockMusicals)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedMusicalId, setSelectedMusicalId] = useState(null)
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [selectedMusical, setSelectedMusical] = useState(null)

  // 컴포넌트 마운트 시와 쿠키 변경 시 로그인 상태 체크
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        console.log('Checking login status...'); // 디버깅용
        
        // 백엔드에 로그인 상태 확인 요청
        const response = await fetch('http://localhost:8080/api/user/me', {
          credentials: 'include' // 쿠키 포함
        });
        
        if (response.ok) {
          const userData = await response.json();
          console.log('User data:', userData);
          setUser(userData);
          setIsLoggedIn(true);
        } else {
          console.log('Not logged in or error:', response.status);
          setUser(null);
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Error checking login status:', error);
        setUser(null);
        setIsLoggedIn(false);
      }
    };

    // 초기 체크
    checkLoginStatus();
  }, []);

  useEffect(() => {
    if (!isLoggedIn && activeSort === "my-reservations") {
      handleSortChange("latest")
    }
  }, [isLoggedIn])

  const handleLogin = () => {
    if (isLoggedIn) {
      // 로그아웃 처리
      console.log("Logging out...")
      // 백엔드 로그아웃 엔드포인트 호출
      fetch("http://localhost:8080/api/auth/logout", {
        method: "POST",
        credentials: "include", // 쿠키 포함
      })
        .then(() => {
          // 쿠키 삭제
          document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
          setIsLoggedIn(false)
        })
        .catch((error) => {
          console.error("Logout failed:", error)
        })
    } else {
      // 로그인 처리
      console.log("Redirecting to Google OAuth...")
      window.location.href = "http://localhost:8080/oauth2/authorization/google"
    }
  }

  const handleSortChange = (sortOption) => {
    setActiveSort(sortOption)
    let sortedMusicals = [...mockMusicals]

    switch (sortOption) {
      case "most-reserved":
        sortedMusicals.sort((a, b) => b.totalSeats - b.remainingSeats - (a.totalSeats - a.remainingSeats))
        break
      case "my-reservations":
        sortedMusicals = sortedMusicals.filter((musical) => musical.isReserved)
        break
      case "latest":
      default:
        break
    }

    setMusicals(sortedMusicals)
  }

  const handleReservation = (musicalId) => {
    const musical = musicals.find((m) => m.id === musicalId)
    if (!musical) return

    if (musical.isReserved) {
      setSelectedMusicalId(musicalId)
      setShowCancelModal(true)
    } else {
      console.log('Opening reservation modal for:', musical.title)
      setSelectedMusical(musical)
      setShowReservationModal(true)
    }
  }

  const handleReservationSuccess = (seatId) => {
    console.log('Reservation success for seat:', seatId)
    if (selectedMusical) {
      setMusicals((prev) =>
        prev.map((m) =>
          m.id === selectedMusical.id
            ? { ...m, isReserved: true, remainingSeats: m.remainingSeats - 1 }
            : m
        )
      )
    }
    setShowReservationModal(false)
    setSelectedMusical(null)
  }

  const confirmCancelReservation = () => {
    if (selectedMusicalId) {
      setMusicals((prev) =>
        prev.map((m) =>
          m.id === selectedMusicalId ? { ...m, isReserved: false, remainingSeats: m.remainingSeats + 1 } : m,
        ),
      )
    }
    setShowCancelModal(false)
    setSelectedMusicalId(null)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat("ko-KR").format(price) + "원"
  }

  const getButtonText = (musical) => {
    if (musical.remainingSeats === 0) return "Sold Out"
    return musical.isReserved ? "Cancel Reservation" : "Reserve"
  }

  const getButtonVariant = (musical) => {
    if (musical.remainingSeats === 0) return "secondary"
    return musical.isReserved ? "destructive" : "default"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Grape className="h-8 w-8 text-purple-600 mr-2" />
              <span className="text-xl font-bold text-gray-900">SaveMyPodo</span>
            </div>
            {/* 로그인 버튼 */}
            <div className="flex items-center gap-4">
              {isLoggedIn && user && (
                <span className="text-gray-700 font-medium">{user.nickname}</span>
              )}
              <Button onClick={handleLogin} variant={isLoggedIn ? "outline" : "default"}>
                {isLoggedIn ? "Logout" : "Login"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Sort Buttons */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={activeSort === "latest" ? "default" : "outline"}
            onClick={() => handleSortChange("latest")}
            className="flex-1 sm:flex-none"
          >
            Latest
          </Button>
          <Button
            variant={activeSort === "most-reserved" ? "default" : "outline"}
            onClick={() => handleSortChange("most-reserved")}
            className="flex-1 sm:flex-none"
          >
            Most Reserved
          </Button>
          {isLoggedIn && (
            <Button
              variant={activeSort === "my-reservations" ? "default" : "outline"}
              onClick={() => handleSortChange("my-reservations")}
              className="flex-1 sm:flex-none"
            >
              My Reservations
            </Button>
          )}
        </div>

        {/* Musical Cards List */}
        <div className="space-y-4">
          {musicals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No musicals found.</p>
            </div>
          ) : (
            musicals.map((musical) => (
              <div key={musical.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  {/* Poster Image */}
                  <div className="sm:w-48 sm:flex-shrink-0">
                    <img
                      src={musical.posterUrl || "/placeholder.svg"}
                      alt={musical.title}
                      className="w-full h-48 sm:h-full object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6">
                    <div className="flex flex-col h-full">
                      {/* Title and Time */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">{musical.title}</h3>
                          <div className="flex items-center text-gray-600 mb-2">
                            <Clock className="h-4 w-4 mr-1" />
                            <span className="text-sm">{musical.timeRange}</span>
                          </div>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 mt-2 sm:mt-0">
                          <Users className="h-4 w-4 mr-1" />
                          <span className={musical.remainingSeats === 0 ? "text-red-600 font-semibold" : ""}>
                            {musical.remainingSeats}/{musical.totalSeats} seats
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-gray-700 text-sm mb-4 flex-1">{musical.description}</p>

                      {/* Price and Reservation Button */}
                      <div className="flex justify-between items-end">
                        <div className="flex items-center text-lg font-bold text-purple-600">
                          <span>{formatPrice(musical.price)}</span>
                        </div>

                        {isLoggedIn && (
                          <Button
                            onClick={() => handleReservation(musical.id)}
                            variant={getButtonVariant(musical)}
                            disabled={musical.remainingSeats === 0 && !musical.isReserved}
                            className="ml-4"
                          >
                            {getButtonText(musical)}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Cancel Reservation Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Reservation</DialogTitle>
            <DialogDescription>Do you really want to cancel the reservation?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelModal(false)}>
              No
            </Button>
            <Button variant="destructive" onClick={confirmCancelReservation}>
              Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reservation Modal */}
      <ReservationModal
        open={showReservationModal}
        onOpenChange={setShowReservationModal}
        musical={selectedMusical}
        onReservationSuccess={handleReservationSuccess}
      />
    </div>
  )
}
