import {
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const summaryCards = [
  {
    title: 'Total Sent',
    value: '12,480',
    helper: 'Messages in the last 30 days',
  },
  {
    title: 'Delivered %',
    value: '96.4%',
    helper: 'Average delivery success rate',
  },
  {
    title: 'Read %',
    value: '71.8%',
    helper: 'Average read rate across campaigns',
  },
];

const dailyMessagesData = [
  { day: 'Mon', sent: 360, delivered: 346 },
  { day: 'Tue', sent: 410, delivered: 395 },
  { day: 'Wed', sent: 390, delivered: 372 },
  { day: 'Thu', sent: 460, delivered: 447 },
  { day: 'Fri', sent: 520, delivered: 502 },
  { day: 'Sat', sent: 440, delivered: 421 },
  { day: 'Sun', sent: 380, delivered: 365 },
];

const campaignPerformanceData = [
  { campaign: 'Welcome', delivered: 98, read: 76 },
  { campaign: 'Offers', delivered: 95, read: 69 },
  { campaign: 'Reminders', delivered: 94, read: 73 },
  { campaign: 'Reactivation', delivered: 90, read: 61 },
  { campaign: 'Feedback', delivered: 97, read: 82 },
];

function SummaryCard({ title, value, helper }) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{helper}</p>
    </article>
  );
}

export default function AnalyticsDashboard() {
  return (
    <section className="space-y-5" aria-label="Analytics Dashboard">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summaryCards.map((card) => (
          <SummaryCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <header className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Daily messages</h2>
            <p className="text-sm text-gray-500">
              Sent vs delivered volumes by weekday
            </p>
          </header>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyMessagesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sent"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Sent"
                />
                <Line
                  type="monotone"
                  dataKey="delivered"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Delivered"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <header className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Campaign performance
            </h2>
            <p className="text-sm text-gray-500">
              Delivery and read rates by campaign type
            </p>
          </header>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaignPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="campaign" />
                <YAxis unit="%" />
                <Tooltip formatter={(value) => [`${value}%`]} />
                <Legend />
                <Bar dataKey="delivered" fill="#2563eb" name="Delivered %" />
                <Bar dataKey="read" fill="#22c55e" name="Read %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>
    </section>
  );
}
