import HomePage from '@/components/HomePage/HomePage'

import preparedTeamData from '@/app/preparedData/aboutData.json'
import AboutPopup from '@/components/HomePage/AboutPopup/AboutPopup';

export default function page() {
  // console.log(preparedTeamData);
  
  const teamData = {
    title: "Ми є креативна формація",
    buttonText: "більше",
    hiddenText: "хто ми",
    members: preparedTeamData?.team?.list?.map((currMember) => currMember?.image),
  }

  console.log(teamData);
  
  return (
    <HomePage data={teamData} />
  )
}
