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
import ReservationModal from "@/components/ReservationModal"
import { musicalAPI } from "@/lib/api"



export default function HomePage() {
  const [user, setUser] = useState(null)
  const [allMusicals, setAllMusicals] = useState([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeSort, setActiveSort] = useState("newest")
  const [musicals, setMusicals] = useState([])
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedMusicalId, setSelectedMusicalId] = useState(null)
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [selectedMusical, setSelectedMusical] = useState(null)
  const [showCancelSuccess, setShowCancelSuccess] = useState(false)


  // 컴포넌트 마운트 시와 쿠키 변경 시 로그인 상태 체크
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        // console.log('Checking login status...'); // 디버깅용
        
        // 백엔드에 로그인 상태 확인 요청
        const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/user/me`, {
          credentials: 'include' // 쿠키 포함
        });
        
        if (response.ok) {
          const userData = await response.json();
          // console.log('User data:', userData);
          setUser(userData);
          setIsLoggedIn(true);
        } else {

          setUser(null);
          setIsLoggedIn(false);
        }
      } catch (error) {
        
        setUser(null);
        setIsLoggedIn(false);
      }
    };

    // 초기 체크
    checkLoginStatus();
  }, []);

  useEffect(() => {
    if (!isLoggedIn && activeSort === "my-reservations") {
      handleSortChange("newest")
    }
  }, [isLoggedIn])

  const handleLogin = () => {
    if (isLoggedIn) {
      // 로그아웃 처리
      console.log("Logging out...")
      // 백엔드 로그아웃 엔드포인트 호출
      fetch(`${import.meta.env.VITE_SERVER_URL}/api/user/logout`, {
        method: "POST",
        credentials: "include", // 쿠키 포함
      })
        .then(() => {
            // JS로 삭제 가능한 쿠키 모두 삭제
        document.cookie.split(";").forEach(cookie => {
          const name = cookie.split("=")[0].trim();
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
        });
        setIsLoggedIn(false);
        setUser(null);
        })
        .catch((error) => {
          console.error("Logout failed:", error)
        })
    } else {
      // 로그인 처리
      console.log("Redirecting to Google OAuth...")
      window.location.href = `${import.meta.env.VITE_SERVER_URL}/oauth2/authorization/google`
    }
  }

   useEffect(() => {
    fetchMusicals()
  }, [])


  const fetchMusicals = async () => {
    try {
      const data = await musicalAPI.getMusicals()
      console.log("Fetched musicals:", data)
      setAllMusicals(data)
      setMusicals(data) // 초기 정렬 없이 전체 목록 표시
    } catch (err) {
      console.error("Failed to fetch musicals:", err)
    }
  }

  const handleSortChange = async (sortOption) => {
    setActiveSort(sortOption)
    
    // 항상 최신 데이터를 API에서 받아오도록 변경
    try {
      const data = await musicalAPI.getMusicals()
      let sortedMusicals = [...data] // API에서 받은 최신 데이터 기준 정렬

      switch (sortOption) {
        case "most-reserved":
          sortedMusicals.sort(
            (a, b) =>
              140 - b.remainingSeats - (140 - a.remainingSeats)
          )
          break
        case "my-reservations":
          sortedMusicals = sortedMusicals.filter((musical) => musical.isReserved)
          break
        case "newest":
          sortedMusicals.sort((a, b) => {
            const today = new Date()
            const dateA = new Date(a.date + "T00:00:00")
            const dateB = new Date(b.date + "T00:00:00")
            const diffA = Math.abs(dateA - today)
            const diffB = Math.abs(dateB - today)
            return diffA - diffB
          })
          break
        default:
          break
      }
      setMusicals(sortedMusicals)
    } catch (err) {
      console.error("Failed to fetch musicals:", err)
    }
  }


  const handleReservation = (musicalId) => {
    console.log("Handling reservation for musical ID:", musicalId)
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



const confirmCancelReservation = async () => {
  if (!selectedMusicalId) return

  try {
    await musicalAPI.cancelReservation(selectedMusicalId) // 🧩 실제 API 호출
    
    setMusicals((prev) =>
      prev.map((m) =>
        m.id === selectedMusicalId ? { ...m, isReserved: false, remainingSeats: m.remainingSeats + 1 } : m,
      )
    )
    setShowCancelModal(false)
    setShowCancelSuccess(true)

    // 내 예약목록 조회일 때만 isReserved가 true인 것만 반영
    const updatedMusicals = await musicalAPI.getMusicals()
    if (activeSort === "my-reservations") {
      setMusicals(updatedMusicals.filter(musical => musical.isReserved === true))
    } else {
      setMusicals(updatedMusicals)
    }

  } catch (error) {
    console.error("🎭 예약 취소 실패:", error)
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
            variant={activeSort === "newest" ? "default" : "outline"}
            onClick={() => handleSortChange("newest")}
            className="flex-1 sm:flex-none"
          >
            Newest
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
                            {musical.remainingSeats}/140 seats
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

<Dialog open={showCancelSuccess} onOpenChange={setShowCancelSuccess}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>예약 취소 완료</DialogTitle>
      <DialogDescription>
        예약이 성공적으로 취소되었습니다.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button onClick={() => setShowCancelSuccess(false)}>
        닫기
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