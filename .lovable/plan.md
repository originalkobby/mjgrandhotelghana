
  <h2>Plan: Make “Weekly Operations” a Dynamic Fold-In / Fold-Out Calendar</h2>

  <p>I will redesign the selected <strong>Weekly Operations</strong> panel on <code>/admin/inventory</code> into a compact weekly calendar/accordion where each day/date can be expanded to reveal its full operational details.</p>

  <h3>What will change</h3>

  <ol>
    <li>
      <strong>Replace the current stacked summary cards with a fold-in / fold-out daily calendar</strong>
      <ul>
        <li>Each day of the selected week will appear as a compact calendar row/card.</li>
        <li>The row will show the weekday, date, booked rooms, expected arrivals, and expected departures.</li>
        <li>Clicking a day will expand it; clicking again will fold it back in.</li>
      </ul>
    </li>

    <li>
      <strong>Show detailed information inside each expanded day</strong>
      <ul>
        <li>Room inventory summary for that date.</li>
        <li>Total booked rooms.</li>
        <li>Available rooms.</li>
        <li>Closed room types / closure reasons.</li>
        <li>Expected check-ins for that date.</li>
        <li>Expected check-outs for that date.</li>
        <li>Room-specific occupancy breakdown, grouped by room type.</li>
      </ul>
    </li>

    <li>
      <strong>Make the structure dynamic</strong>
      <ul>
        <li>The panel will be generated from the current selected week, not hardcoded.</li>
        <li>Changing Previous / Next week will automatically update all fold-out day panels.</li>
        <li>The data will come from the existing <code>room_inventory</code>, <code>rooms</code>, and <code>bookings</code> queries.</li>
        <li>If a day has no arrivals, departures, closures, or bookings, it will show a clean empty-state message instead of blank space.</li>
      </ul>
    </li>

    <li>
      <strong>Use a single-open accordion behavior</strong>
      <ul>
        <li>Only one day/date will be expanded at a time to keep the section compact.</li>
        <li>The current date can be opened by default when it falls within the selected week.</li>
        <li>Other days remain folded in until selected.</li>
      </ul>
    </li>

    <li>
      <strong>Preserve the existing height and scrolling behavior</strong>
      <ul>
        <li>The panel will keep the recently adjusted height.</li>
        <li>The vertical scroll area will remain available for the full week.</li>
        <li>The design will avoid adding a horizontal scrollbar.</li>
      </ul>
    </li>
  </ol>

  <h3>Technical implementation</h3>

  <ul>
    <li>Update <code>src/pages/admin/Inventory.tsx</code>.</li>
    <li>Import and use the existing Shadcn/Radix accordion components from <code>src/components/ui/accordion.tsx</code>.</li>
    <li>Extend the daily operations data model beyond simple counts by building a per-date structure such as:</li>
  </ul>

  <pre><code>DailyOperations {
  date
  bookedRooms
  expectedCheckIns
  expectedCheckOuts
  roomBreakdown[]
  closedRooms[]
  arrivals[]
  departures[]
}</code></pre>

  <ul>
    <li>Enhance <code>fetchInventoryData</code> so it fetches enough booking details for arrivals/departures, such as:</li>
  </ul>

  <pre><code>bookings:
- reference_code
- check_in
- check_out
- room_number
- status
- rooms(name)
- guests(full_name, email, phone)</code></pre>

  <ul>
    <li>Build each day’s expanded content from live data:
      <ul>
        <li><code>room_inventory</code> for booked/available/closed room stats.</li>
        <li><code>bookings.check_in</code> for arrivals.</li>
        <li><code>bookings.check_out</code> for departures.</li>
        <li><code>rooms</code> for room names and base room data.</li>
      </ul>
    </li>
    <li>Keep British date formatting, e.g. <code>Mon 20/04/2026</code>, consistent with project localization rules.</li>
    <li>Keep the visual style consistent with the existing luxury admin dashboard: white cards, muted borders, soft gold accents, compact typography, and no bounce animations.</li>
  </ul>

  <h3>Result</h3>

  <p>The Weekly Operations section will become a more useful operational calendar: compact by default, expandable by day/date, and detailed enough for front desk/admin staff to see all relevant information without crowding the main inventory grid.</p>
