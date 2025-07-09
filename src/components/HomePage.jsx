"use client"

import { isAuthenticated, logout } from "@/lib/auth"
import { useState, useEffect } from "react"
import { Grape, Clock, Users } from "lucide-react"
import { Button } from "@/components/ui/Button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog"
import ReservationModal from "./ReservationModal"
import { musicalAPI } from "@/lib/api"


const mockUser = {
  name: "John Doe",
  email: "john.doe@example.com",
}


export default function HomePage() {
  const [user, setUser] = useState(null)
  const [allMusicals, setAllMusicals] = useState([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeSort, setActiveSort] = useState("latest")
  const [musicals, setMusicals] = useState([])
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedMusicalId, setSelectedMusicalId] = useState(null)
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [selectedMusical, setSelectedMusical] = useState(null)

  const checkAuthStatus = async () => {
    if (isAuthenticated()) {
      try {
        const userData = await userAPI.getProfile()
        setUser(userData)
        setIsLoggedIn(true)
      } catch (err) {
        logout()
        setIsLoggedIn(false)
      }
    }
  }

  useEffect(() => {
    checkAuthStatus()
  }, [])
  
  useEffect(() => {
    if (!isLoggedIn && activeSort === "my-reservations") {
      handleSortChange("latest")
    }
  }, [isLoggedIn])

  const handleLogin = () => {
    setIsLoggedIn(!isLoggedIn)
  }

  useEffect(() => {
    fetchMusicals()
  }, [])
  
  // 🛑 현재는 백엔드에서 뮤지컬 목록을 하드코딩하여 응답 중
  // ✅ 추후 연동 필요: DB에서 뮤지컬 정보를 조회하도록 백엔드 구현 필요
  // 🔧 연동 대상: MusicalController.getMusicals
  const fetchMusicals = async () => {
    try {
      const data = await musicalAPI.getMusicals()
      setAllMusicals(data)
      setMusicals(data) // 초기 정렬 없이 전체 목록 표시
    } catch (err) {
      console.error("Failed to fetch musicals:", err)
    }
  }

  const handleSortChange = (sortOption) => {
    setActiveSort(sortOption)
    let sortedMusicals = [...allMusicals] // 원본 기준 정렬
  
    switch (sortOption) {
      case "most-reserved":
        sortedMusicals.sort(
          (a, b) =>
            b.totalSeats - b.remainingSeats - (a.totalSeats - a.remainingSeats)
        )
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
      // 팝업으로 좌석 선택 모달 열기
      setSelectedMusical(musical)
      setShowReservationModal(true)
    }
  }


// 🛑 현재는 프론트에서만 예약 취소 처리
// ✅ 백엔드 연동 필요: 예약 취소 요청을 DELETE 방식으로 서버에 전달해야 함
// 🔧 연동 대상: ReservationController 또는 별도의 CancelReservationController
const confirmCancelReservation = async () => {
  if (!selectedMusicalId) return

  try {
    await musicalAPI.cancelReservation(selectedMusicalId) // 🧩 실제 API 호출

    setMusicals((prev) =>
      prev.map((m) =>
        m.id === selectedMusicalId ? { ...m, isReserved: false, remainingSeats: m.remainingSeats + 1 } : m,
      )
    )
  } catch (error) {
    console.error("예약 취소 실패:", error)
    // 실패 알림 표시 등 추가 가능
  } finally {
    setShowCancelModal(false)
    setSelectedMusicalId(null)
  }
}

const handleReservationSuccess = async (seatId) => {
  try {
    // 최신 뮤지컬 데이터 다시 불러오기 (예약 반영된 상태로)
    const updatedMusicals = await musicalAPI.getMusicals()
    setMusicals(updatedMusicals)
  } catch (error) {
    console.error("🎭 뮤지컬 갱신 실패:", error)
  } finally {
    setShowReservationModal(false)
    setSelectedMusical(null)
  }
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
            <div className="flex items-center gap-4">
              {isLoggedIn && <span className="text-gray-700 font-medium">{mockUser.name}</span>}
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

      {/* Reservation Modal (팝업) */}
      <ReservationModal
        open={showReservationModal}
        onOpenChange={setShowReservationModal}
        musical={selectedMusical}
        onReservationSuccess={handleReservationSuccess}
      />
    </div>
  )
}
