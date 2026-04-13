export const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
};

export const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

export const formatDateTime = (iso: string): string =>
  `${formatDate(iso)} à ${formatTime(iso)}`;

export const formatDateShort = (iso: string): string =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });

export const formatNom = (nom: string, prenom: string): string =>
  `${prenom} ${nom.toUpperCase()}`;

export const formatInitiales = (nom: string, prenom: string): string =>
  `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();

export const formatRelativeTime = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'À l\'instant';
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `Il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `Il y a ${days}j`;
};
