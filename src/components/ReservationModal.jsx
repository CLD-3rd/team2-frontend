"use client"

import { formatDate } from "@/lib/utils"
import { useState, useEffect } from "react"
import { Clock, X } from "lucide-react"
import { Button } from "@/components/ui/Button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog"
import { Alert, AlertDescription } from "@/components/ui/Alert"
import { musicalAPI } from "@/lib/api"
import { getUserId } from "@/lib/auth"

// Generate seat grid data (A-J rows, 1-14 columns)
const generateSeatGrid = (reservedSeats = []) => {
  const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]
  const seats = []

  // Convert reserved seats array to Set for efficient lookup
  const reservedSeatsSet = new Set(reservedSeats.map(seat => seat.seatId))

  rows.forEach((row) => {
    for (let col = 1; col <= 14; col++) {
      const seatId = `${row}${col}`
      seats.push({
        id: seatId,
        row,
        column: col,
        isReserved: reservedSeatsSet.has(seatId),
        isSelected: false,
      })
    }
  })

  return seats
}

export default function ReservationModal({ open, onOpenChange, musical, onReservationSuccess }) {
  const [seats, setSeats] = useState([])
  const [selectedSeats, setSelectedSeats] = useState([])
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showErrorAlert, setShowErrorAlert] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSeats, setIsLoadingSeats] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  // 좌석 정보 로드
  useEffect(() => {
    if (open && musical) {
      loadSeats()
    }
  }, [open, musical])
  
  
  // 🛑 현재는 서버에서 좌석 정보를 하드코딩하여 응답 중 (SeatController.getReservedSeats)
  // ✅ 추후 연동 필요: DB 또는 예약 내역 기반으로 실제 예약된 좌석을 불러오도록 수정 필요
  const loadSeats = async () => {
    if (!musical || !musical.date) {
      console.warn("musical.date가 없거나 잘못되었습니다.", musical)
      return
    }
  
    setIsLoadingSeats(true)
    setErrorMessage("")
  
    try {
      const seatsData = await musicalAPI.getSeats(musical.id, musical.date)
      console.log("✅ getSeats 응답:", seatsData)
      const seatGrid = generateSeatGrid(seatsData?.reservedSeats || [])
      setSeats(seatGrid)
    } catch (error) {
      console.error('❌ Failed to load seats:', error)
      setErrorMessage("좌석 정보를 불러오는데 실패했습니다.")
      setSeats(generateSeatGrid())
    } finally {
      setIsLoadingSeats(false)
    }
  }

  if (!musical) return null

  const handleSeatClick = (seatId) => {
    const seat = seats.find((s) => s.id === seatId)
    if (seat.isReserved) return

    // If clicking on already selected seat, deselect it
    if (seat.isSelected) {
      setSeats((prevSeats) => prevSeats.map((s) => (s.id === seatId ? { ...s, isSelected: false } : s)))
      setSelectedSeats([])
      return
    }

    // Deselect all seats and select only the clicked one
    setSeats((prevSeats) =>
      prevSeats.map((s) => ({
        ...s,
        isSelected: s.id === seatId,
      })),
    )

    setSelectedSeats([seatId])
  }

  const getSeatClassName = (seat) => {
    if (!seat) return "bg-gray-200 text-gray-400 cursor-not-allowed"
  
    if (seat.isReserved) {
      return "bg-gray-300 cursor-not-allowed text-gray-500"
    } else if (seat.isSelected) {
      return "bg-purple-600 text-white cursor-pointer hover:bg-purple-700"
    } else {
      return "bg-teal-500 text-white cursor-pointer hover:bg-teal-600"
    }
  }
  

  const formatPrice = (price) => {
    return new Intl.NumberFormat("ko-KR").format(price) + "원"
  }

  const totalPrice = selectedSeats.length * musical.price

  const handleReservation = () => {
    setShowConfirmModal(true)
  }

  // ✅ 백엔드 연동 필요: musicalAPI.createReservation 호출하여 예약 정보 POST
  // 👉 백엔드는 ReservationController.createReservation에서 DB 저장 처리 필요
  const confirmReservation = async () => {
    setIsLoading(true)
  
    try {
      const reservationData = {
        musicalId: musical.id,
        date: musical.date,
        seats: selectedSeats,
        totalPrice: totalPrice,
        userId: getUserId(),
      }
  
      const result = await musicalAPI.createReservation(reservationData)
  
      // ✅ 백엔드에서 오류 없었을 때만 상태 업데이트
      console.log("Reservation successful!", result)
      onReservationSuccess(selectedSeats[0])
  
      setShowConfirmModal(false)
      await loadSeats()
      setSelectedSeats([])
    } catch (error) {
      console.error("Reservation failed:", error)
      setShowConfirmModal(false)
      setShowErrorAlert(true)
      setErrorMessage(error.message || "예약에 실패했습니다. 다시 시도해주세요.")
      setTimeout(() => {
        setShowErrorAlert(false)
        setErrorMessage("")
      }, 5000)
    } finally {
      setIsLoading(false)
    }
  }
  

  const handleClose = () => {
    setSeats([])
    setSelectedSeats([])
    setShowErrorAlert(false)
    setErrorMessage("")
    onOpenChange(false)
  }

  const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Seat Selection - {musical.title}</DialogTitle>
            <DialogDescription>
              {musical.timeRange} | {formatPrice(musical.price)} per seat
            </DialogDescription>
          </DialogHeader>

          {/* Error Alert */}
          {showErrorAlert && (
            <Alert className="border-red-200 bg-red-50 mb-4">
              <AlertDescription className="text-red-800">
                {errorMessage || "Seat already reserved. Please try again."}
              </AlertDescription>
            </Alert>
          )}

          {/* Loading Alert */}
          {isLoadingSeats && (
            <Alert className="border-blue-200 bg-blue-50 mb-4">
              <AlertDescription className="text-blue-800">좌석 정보를 불러오는 중...</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Seat Selection Area */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg border p-6">
                {/* Screen */}
                <div className="text-center mb-8">
                  <div className="inline-block bg-gray-200 px-8 py-2 rounded-full text-gray-600 font-medium">
                    SCREEN
                  </div>
                </div>

                {/* Seat Grid */}
                <div className="overflow-x-auto">
                  {isLoadingSeats ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-gray-500">좌석 정보를 불러오는 중...</div>
                    </div>
                  ) : (
                    <div className="inline-block min-w-full">
                      {rows.map((row) => (
                        <div key={row} className="flex items-center justify-center mb-2">
                          {/* Row Label */}
                          <div className="w-8 text-center font-medium text-gray-600 mr-4">{row}</div>

                          {/* Seats in Row */}
                          <div className="flex gap-1">
                            {Array.from({ length: 14 }, (_, i) => {
                              const seatId = `${row}${i + 1}`
                              const seat = seats.find((s) => s.id === seatId)

                              return (
                                <button
                                  key={seatId}
                                  onClick={() => handleSeatClick(seatId)}
                                  className={`
                                    w-8 h-8 text-xs font-medium rounded transition-colors
                                    flex items-center justify-center
                                    ${getSeatClassName(seat)}
                                  `}
                                  disabled={seat?.isReserved || isLoadingSeats}
                                >
                                  {seat?.isReserved ? <X className="h-4 w-4" /> : i + 1}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-6 mt-8 pt-6 border-t">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-teal-500 rounded mr-2"></div>
                    <span className="text-sm text-gray-600">Available</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-purple-600 rounded mr-2"></div>
                    <span className="text-sm text-gray-600">Selected</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-gray-300 rounded mr-2 flex items-center justify-center">
                      <X className="h-3 w-3 text-gray-500" />
                    </div>
                    <span className="text-sm text-gray-600">Reserved</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800 text-white rounded-lg p-6">
                {/* Musical Info */}
                <div className="mb-6">
                  <div className="flex items-start gap-4 mb-4">
                    <img
                      src={musical.posterUrl || "/placeholder.svg"}
                      alt={musical.title}
                      className="w-16 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{musical.title}</h3>
                      <p className="text-gray-300 text-sm mb-1">{formatDate(musical.date)}</p>
                      <div className="flex items-center text-gray-300 text-sm">
                        <Clock className="h-4 w-4 mr-1" />
                        {musical.timeRange}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selected Seats */}
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Selected Seat</h4>
                  {selectedSeats.length === 0 ? (
                    <p className="text-gray-400 text-sm">No seats selected</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedSeats.map((seatId) => (
                        <div key={seatId} className="flex justify-between items-center bg-gray-700 px-3 py-2 rounded">
                          <span className="font-medium">{seatId}</span>
                          <span className="text-sm text-gray-300">{formatPrice(musical.price)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total Price */}
                <div className="border-t border-gray-600 pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total</span>
                    <span className="text-xl font-bold">{formatPrice(totalPrice)}</span>
                  </div>
                </div>

                {/* Reserve Button */}
                <Button
                  onClick={handleReservation}
                  disabled={selectedSeats.length === 0}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600"
                >
                  Reserve {selectedSeats.length > 0 ? `(${selectedSeats[0]})` : ""}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Reservation</DialogTitle>
            <DialogDescription>Are you sure you want to proceed with the payment?</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <p>
                <strong>Musical:</strong> {musical.title}
              </p>
              <p>
                <strong>Date & Time:</strong> {formatDate(musical.date)} {musical.timeRange}
              </p>
              <p>
                <strong>Seats:</strong> {selectedSeats.join(", ")}
              </p>
              <p>
                <strong>Total:</strong> {formatPrice(totalPrice)}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmModal(false)} disabled={isLoading}>
              No
            </Button>
            <Button onClick={confirmReservation} disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
              {isLoading ? "Processing..." : "Yes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
