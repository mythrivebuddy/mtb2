import TransactionsHistoryPage from '@/components/transaction-history/TransactionHstory'
import React from 'react'
export const metadata = {
  title: 'Transactions History - MythriveBuddy',
  description: 'View your transaction history and manage your transactions effectively.',
}
function page() {
  return (
    <div><TransactionsHistoryPage/></div>
  )
}

export default page