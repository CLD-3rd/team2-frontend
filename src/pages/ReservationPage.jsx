"use client"

import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Grape, Clock, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Mock musical data
const mockMusicals = {
  1: {
    id: 1,
    title: "The Phantom of the Opera",
    timeRange: "12:15 ~ 14:34",
    date: "2025.07.09(Wed)",
    price: 85000,
    posterUrl: "/placeholder.svg?height=200&width=150",
  },
  2: {
    id: 2,
    title: "Hamilton",
    timeRange: "19:30 ~ 22:00",
    date: "2025.07.09(Wed)",
    price: 120000,
    posterUrl: "/placeholder.svg?height=200&width=150",
  },
  3: {
    id: 3,
    title: "The Lion King",
    timeRange: "15:00 ~ 17:30",
    date: "2025.07.09(Wed)",
    price: 95000,
    posterUrl: "/placeholder.svg?height=200&width=150",
  },
}

const mockUser = {
  name: "John Doe",
  email: "john.doe@example.com",
}

// Generate seat grid data (A-J rows, 1-14 columns)
const generateSeatGrid = () => {
  const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]
  const seats = []

  // Mock some reserved seats
  const reservedSeats = new Set(["A5", "A6", "B8", "C3", "C12", "F7", "F8", "G10", "H5", "I9"])

  rows.forEach((row) => {
    for (let col = 1; col <= 14; col++) {
      const seatId = `${row}${col}`
      seats.push({
        id: seatId,
        row,
        column: col,
        isReserved: reservedSeats.has(seatId),
        isSelected: false,
      })
    }
  })

  return seats
}

export default function ReservationPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const musical = mockMusicals[id]

  const [seats, setSeats] = useState(generateSeatGrid())
  const [selectedSeats, setSelectedSeats] = useState([])
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showErrorAlert, setShowErrorAlert] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showBackModal, setShowBackModal] = useState(false)

  if (!musical) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Musical not found</h1>
          <Button onClick={() => navigate("/")}>Go back to home</Button>
        </div>
      </div>
    )
  }

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

  const confirmReservation = async () => {
    setIsLoading(true)

    // Simulate API call with potential error
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Simulate 500 error (10% chance)
      if (Math.random() < 0.1) {
        throw new Error("Seat already reserved")
      }

      // Success - redirect or show success message
      console.log("Reservation successful!")
      setShowConfirmModal(false)
      navigate("/")
    } catch (error) {
      // Handle error
      setShowConfirmModal(false)
      setShowErrorAlert(true)

      // Reset seat selection and refresh
      setSeats(generateSeatGrid())
      setSelectedSeats([])

      // Hide error after 5 seconds
      setTimeout(() => setShowErrorAlert(false), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button variant="ghost" className="mr-4" onClick={() => setShowBackModal(true)}>
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back
              </Button>
              <div className="flex items-center">
                <Grape className="h-8 w-8 text-purple-600 mr-2" />
                <span className="text-xl font-bold text-gray-900">SaveMyPodo</span>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 font-medium">{mockUser.name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Back Confirmation Modal */}
      <Dialog open={showBackModal} onOpenChange={setShowBackModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Reservation</DialogTitle>
            <DialogDescription>Are you sure you want to go back? Your seat selection will be lost.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBackModal(false)}>
              Stay
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowBackModal(false)
                navigate("/")
              }}
            >
              Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Alert */}
      {showErrorAlert && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">Seat already reserved. Please try again.</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Seat Selection Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Seat Selection</h2>

              {/* Screen */}
              <div className="text-center mb-8">
                <div className="inline-block bg-gray-200 px-8 py-2 rounded-full text-gray-600 font-medium">SCREEN</div>
              </div>

              {/* Seat Grid */}
              <div className="overflow-x-auto">
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
                              disabled={seat.isReserved}
                            >
                              {seat.isReserved ? <X className="h-4 w-4" /> : i + 1}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
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
            <div className="bg-gray-800 text-white rounded-lg shadow-md p-6 sticky top-6">
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
                    <p className="text-gray-300 text-sm mb-1">{musical.date}</p>
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
      </div>

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
                <strong>Date & Time:</strong> {musical.date} {musical.timeRange}
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
    </div>
  )
}
