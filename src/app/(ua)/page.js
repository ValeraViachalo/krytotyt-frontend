import HomePage from '@/components/HomePage/HomePage'

import { client } from '@/lib/sanity/client';
import { QUERY_HOME_PAGE } from '@/lib/sanity/query';

export const revalidate = 60;

export default async function page() {
  const data = await client.fetch(QUERY_HOME_PAGE, { lang: 'ua' })
  console.log(data);
  
  const teamData = {
    title: "Ми є креативна формація",
    buttonText: "більше",
    hiddenText: "хто ми",
    members: data?.teamList,
  }
  
  return (
    <HomePage data={teamData} />
  )
}
