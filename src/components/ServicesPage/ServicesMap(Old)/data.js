/**
 * Static map layout data.
 * Each category has a world-space `position` and a list of `services`
 * with `offset` relative to that position and a visual `size`.
 *
 * `slug` values MUST match the slugs returned by Sanity's
 * QUERY_SERVICES_PAGE so the filter can focus the correct category.
 */

export const categories = [
  {
    id: "interior-design",
    slug: "interior-design",
    title: "дизайн інтер'єру",
    position: { x: 0, y: 0 },
    services: [
      { id: "1", title: "авторський нагляд", size: "lg", offset: { x: -75, y: -225 } },
      { id: "2", title: "креативний дизайн", size: "xl", offset: { x: -225, y: -75 } },
      { id: "3", title: "технічний дизайн", size: "lg", offset: { x: -375, y: 75 } },
      { id: "4", title: "зонування простору", size: "xl", offset: { x: 300, y: 150 } },
      { id: "5", title: "інтер'єрні рішення", size: "md", offset: { x: 375, y: -150 } },
      { id: "6", title: "дизайн-проєкт", size: "md", offset: { x: 525, y: 0 } },
      { id: "7", title: "функціональний дизайн", size: "sm", offset: { x: 0, y: -120 } },
      { id: "8", title: "комплектація", size: "sm", offset: { x: 150, y: -45 } },
      { id: "9", title: "технічні рішення", size: "sm", offset: { x: 75, y: 225 } },
      { id: "10", title: "зонування простору", size: "sm", offset: { x: -300, y: 180 } },
    ],
  },
  {
    id: "furniture",
    slug: "furniture",
    title: "меблі",
    position: { x: -800, y: 600 },
    services: [
      { id: "11", title: "встановлення кухні", size: "lg", offset: { x: 0, y: 0 } },
      { id: "12", title: "столярство", size: "lg", offset: { x: 225, y: 75 } },
      { id: "13", title: "реалізація інсталяції", size: "sm", offset: { x: -150, y: 120 } },
      { id: "14", title: "будова стіни з квітів", size: "sm", offset: { x: 300, y: -75 } },
      { id: "15", title: "фарбування стін", size: "sm", offset: { x: -75, y: 225 } },
      { id: "16", title: "реалізація інсталяції", size: "sm", offset: { x: -75, y: -120 } },
      { id: "17", title: "виготовлення меблів", size: "sm", offset: { x: 75, y: -180 } },
    ],
  },
  {
    id: "engineering",
    slug: "engineering",
    title: "інженерія",
    position: { x: 800, y: 500 },
    services: [
      { id: "18", title: "вентиляція", size: "lg", offset: { x: -75, y: -75 } },
      { id: "19", title: "опалення", size: "lg", offset: { x: 150, y: 0 } },
      { id: "20", title: "електрика", size: "xl", offset: { x: 0, y: 150 } },
      { id: "21", title: "розумний дім", size: "md", offset: { x: 225, y: 225 } },
      { id: "22", title: "водопостачання", size: "sm", offset: { x: -150, y: 225 } },
    ],
  },
  {
    id: "art-installations",
    slug: "art-installations",
    title: "арт-інсталяції",
    position: { x: 600, y: -600 },
    services: [
      { id: "23", title: "скульптури", size: "lg", offset: { x: 0, y: 0 } },
      { id: "24", title: "світлові інсталяції", size: "xl", offset: { x: -225, y: 75 } },
      { id: "25", title: "кінетичні фігури", size: "md", offset: { x: 150, y: -150 } },
      { id: "26", title: "медіа-арт", size: "sm", offset: { x: 225, y: 150 } },
    ],
  },
  {
    id: "metalwork",
    slug: "metalwork",
    title: "вироби з металу",
    position: { x: -700, y: -500 },
    services: [
      { id: "27", title: "сходи", size: "lg", offset: { x: -75, y: -75 } },
      { id: "28", title: "перегородки", size: "xl", offset: { x: 150, y: 0 } },
      { id: "29", title: "меблеві каркаси", size: "md", offset: { x: 0, y: 150 } },
      { id: "30", title: "декор", size: "sm", offset: { x: -200, y: 150 } },
    ],
  },
  {
    id: "sliding-systems",
    slug: "sliding-systems",
    title: "приховані і розсувні системи",
    position: { x: 1200, y: -100 },
    services: [
      { id: "31", title: "двері прихованого монтажу", size: "xl", offset: { x: 0, y: -75 } },
      { id: "32", title: "розсувні перегородки", size: "lg", offset: { x: -225, y: 75 } },
      { id: "33", title: "стінові панелі", size: "md", offset: { x: 225, y: 75 } },
    ],
  },
  {
    id: "music",
    slug: "music",
    title: "музика",
    position: { x: -1200, y: 0 },
    services: [
      { id: "34", title: "акустичні системи", size: "xl", offset: { x: 0, y: 0 } },
      { id: "35", title: "звукоізоляція", size: "lg", offset: { x: -150, y: -150 } },
      { id: "36", title: "мультирум", size: "md", offset: { x: 150, y: 150 } },
    ],
  },
];
