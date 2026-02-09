export const legendGeneral = [
  { term: 'eFG%', desc: 'Skuteczność rzutów z gry z premią za trójki.' },
  { term: 'TS%', desc: 'True Shooting – efektywność rzutów z uwzględnieniem wolnych.' },
  { term: 'TO%', desc: 'Udział strat w posiadaniu piłki.' },
  { term: 'ORB%', desc: 'Udział zbiórek w ataku wśród dostępnych wariantów.' },
  { term: 'FT Rate', desc: 'Ile razy zdobywamy punkty z wolnych per próbę rzutu z gry (FTA/FGA).' },
  { term: '+/-', desc: 'Bilans punktowy zespołu gdy zawodnik jest na boisku.' },
  { term: 'PPG', desc: 'Średnia punktów zdobywana w meczu.' },
  { term: 'RPG', desc: 'Średnia zbiórek w meczu.' },
  { term: 'APG', desc: 'Średnia asyst na mecz.' }
];

export const legendBoxscore = [
  { term: 'C/W', desc: 'Celne i wykonane (trafione/próby).' },
  { term: 'Za 2 / Za 3 / Za 1', desc: 'Rzuty za 2, 3 i wolne.' },
  { term: 'Zb A / Zb O / Zb Su', desc: 'Zbiórki w ataku / obronie / ogółem.' },
  { term: 'A / S / P / B', desc: 'Asysty / Straty / Przechwyty / Bloki.' },
  { term: 'F / FP / FW', desc: 'Faule osobiste / popełnione / wymuszone.' }
];

export const legendTeamStats = [
  { term: 'Punkty po stratach', desc: 'Ile punktów zdobyliśmy po przejęciu piłki.' },
  { term: 'Punkty spod kosza', desc: 'Punkty zdobyte blisko kosza.' },
  { term: 'Punkty drugiej szansy', desc: 'Skuteczne akcje po ofensywnej zbiórce.' },
  { term: 'Punkty po szybkim ataku', desc: 'Szybkie kontry zakończone punktami.' },
  { term: 'Punkty zmienników', desc: 'Punkty zdobyte przez rezerwowych.' }
];

export const legendFiveMinute = [
  { term: 'Okres 5-min', desc: 'Punkty zebrane w bloku 5 minut (dwie połówki = kwarta).' },
  { term: 'Lead', desc: 'Różnica punktowa (BeKaPaKa minus rywal) w danym okresie.' }
];

export const legendRun = [
  { term: 'Run', desc: 'Seria punktowa jednej drużyny bez odpowiedzi przeciwnika.' },
  { term: 'Zmiany prowadzenia', desc: 'Liczba momentów, gdy przejęliśmy prowadzenie.' },
  { term: 'Remisy', desc: 'Liczba sytuacji remisowych w meczu.' }
];

export const legendStrategy = [
  { term: 'FT%', desc: 'Skuteczność wolnych – nisko = trening rzutów.' },
  { term: 'TO%', desc: 'Dużo strat = priorytet ochrona piłki.' },
  { term: '3P%', desc: 'Skuteczność zza łuku – nisko = więcej treningu dystansu.' },
  { term: 'ORB%', desc: 'Zbiórki w ataku – powinna rosnąć.' }
];
