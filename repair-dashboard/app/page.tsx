export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">
          🔧 RepairHub Dashboard
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Mobile Repair Shop Management System
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md border-2 border-blue-200">
            <h2 className="text-2xl font-semibold mb-2">📱 Repairs</h2>
            <p className="text-gray-600">Manage device repairs</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border-2 border-green-200">
            <h2 className="text-2xl font-semibold mb-2">💰 Pricing</h2>
            <p className="text-gray-600">Smart pricing system</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border-2 border-purple-200">
            <h2 className="text-2xl font-semibold mb-2">👥 Customers</h2>
            <p className="text-gray-600">Customer management</p>
          </div>
        </div>
        
        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">🚀 Setup in Progress</h3>
          <p className="text-gray-700">
            The dashboard is being configured. Next steps:
          </p>
          <ul className="list-disc list-inside mt-2 text-gray-700">
            <li>Database setup with Prisma</li>
            <li>API routes implementation</li>
            <li>Core UI components</li>
            <li>Smart pricing algorithm</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
