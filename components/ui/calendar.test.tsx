/** @jest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { Calendar } from "./calendar"

it("navigates months and selects a date using the current DayPicker API", () => {
  const onSelect = jest.fn()
  render(<Calendar mode="single" defaultMonth={new Date(2026, 8, 1)} onSelect={onSelect} />)
  expect(screen.getByText("September 2026")).toBeInTheDocument()
  fireEvent.click(screen.getByRole("button", { name: /next month/i }))
  expect(screen.getByText("October 2026")).toBeInTheDocument()
  fireEvent.click(screen.getByRole("button", { name: /Thursday, October 15th, 2026/i }))
  expect(onSelect.mock.calls[0][0]).toEqual(new Date(2026, 9, 15))
  fireEvent.click(screen.getByRole("button", { name: /previous month/i }))
  expect(screen.getByText("September 2026")).toBeInTheDocument()
})
