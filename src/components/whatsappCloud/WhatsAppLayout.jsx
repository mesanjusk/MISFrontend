export default function WhatsAppLayout({ sidebar, main, details }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="grid h-[calc(100vh-13rem)] min-h-[620px] grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)_320px]">
        <aside className="border-b border-gray-200 lg:border-b-0 lg:border-r">{sidebar}</aside>
        <main className="min-h-0 border-b border-gray-200 lg:border-b-0 lg:border-r">{main}</main>
        <aside className="hidden min-h-0 lg:block">{details}</aside>
      </div>
    </section>
  );
}
