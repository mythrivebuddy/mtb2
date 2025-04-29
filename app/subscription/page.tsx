export default function SubscriptionPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center">
            Unlock Unlimited JoyPearls
            <span className="ml-2">🚀</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the membership that suits you best and start enjoying unlimited JoyPearls to unlock all premium
            features.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Monthly Plan */}
          <div className="bg-[#F1F3FF] border border-gray-200 rounded-lg overflow-hidden p-5">
            <div className="p-6 text-center">
              <h2 className="text-3xl font-bold text-gray-900">Monthly Plan</h2>
              <p className="text-xl text-gray-600 mt-2">$29 per month</p>
            </div>
            <div className="px-6 pb-6">
              <button className="w-full bg-[#151E46] hover:bg-[#1a2a5e] text-white py-3 px-4 rounded-md text-lg font-medium transition-colors">
                Subscribe
              </button>
            </div>
          </div>

          {/* Yearly Plan */}
          <div className="bg-[#F1F3FF] border border-gray-200 rounded-lg overflow-hidden p-5">
            <div className="p-6 text-center">
              <h2 className="text-3xl font-bold text-gray-900">Yearly Plan</h2>
              <p className="text-xl text-gray-600 mt-2">$299 per year (Save 20%)</p>
            </div>
            <div className="px-6 pb-6">
              <button className="w-full bg-[#111c40] hover:bg-[#1a2a5e] text-white py-3 px-4 rounded-md text-lg font-medium transition-colors">
                Subscribe
              </button>
            </div>
          </div>

          {/* Lifetime Plan */}
          <div className="bg-[#F1F3FF] border border-gray-200 rounded-lg overflow-hidden p-5">
            <div className="p-6 text-center">
              <h2 className="text-3xl font-bold text-gray-900">Lifetime Plan</h2>
              <p className="text-xl text-gray-600 mt-2">$2999 (One-time payment)</p>
            </div>
            <div className="px-6 pb-6">
              <button className="w-full bg-[#111c40] hover:bg-[#1a2a5e] text-white py-3 px-4 rounded-md text-lg font-medium transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Banner and Table Section */}
        <div className="bg-[#111c40] text-white rounded-lg p-6 mb-8 relative">
          <div className="mb-8">
            <button className="w-full md:w-auto mx-auto block bg-white text-[#111c40] hover:bg-gray-100 py-3 px-6 rounded-md text-lg font-semibold transition-colors absolute -top-3">
              Invest Once, Thrive Forever — Grab Your Lifetime Plan Now!
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Pricing Table */}
            <div className="col-span-1 lg:col-span-3">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="py-3 text-left">Range</th>
                      <th className="py-3 text-left">Price</th>
                      <th className="py-3 text-left">Tagline</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-700/30">
                      <td className="py-3">01 - 10</td>
                      <td className="py-3">$499</td>
                      <td className="py-3 ">Early Bird Gets The Best Deal!</td>
                    </tr>
                    <tr className="border-b border-gray-700/30">
                      <td className="py-3 text-gray-400">11 - 20</td>
                      <td className="py-3 text-gray-400">$699</td>
                      <td className="py-3 line-through text-gray-400 ">Still Early — Save Big!</td>
                    </tr>
                    <tr className="border-b border-gray-700/30">
                      <td className="py-3 text-gray-400">21 - 30</td>
                      <td className="py-3 text-gray-400">$999</td>
                      <td className="py-3 text-gray-400">Almost Half Gone – Act Fast!</td>
                    </tr>
                    <tr className="border-b border-gray-700/30">
                      <td className="py-3 text-gray-400">31 - 40</td>
                      <td className="py-3 text-gray-400">$1399</td>
                      <td className="py-3 text-gray-400">Last Few Spots Left!</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-gray-400">41 - 50</td>
                      <td className="py-3 text-gray-400">$1899</td>
                      <td className="py-3 text-gray-400">Final Chance At This Offer!</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Limited Offer Box */}
            <div className="col-span-1 bg-white text-[#111c40] rounded-lg p-6">
              <div className="text-center">
                <h3 className="text-3xl font-bold mb-2">Limited Offer</h3>
                <p className="text-[#ff7f7f] font-medium mb-4">Still Early — Save Big!</p>
                <div className="text-5xl font-bold mb-6">18/20</div>
                <button className="w-full bg-[#ff7f7f] hover:bg-[#ff6666] text-white py-3 px-4 rounded-md text-lg font-medium transition-colors">
                  Claim Spot
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
