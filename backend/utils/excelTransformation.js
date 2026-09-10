const MEMBER_FIELDS = ['teamLeader', 'teamMember1', 'teamMember2', 'teamMember3'];

function transformTeamsToNormalizedRows(finalTeams, memberFilter = () => true) {
  const normalizedRows = [];

  finalTeams.forEach((team) => {
    MEMBER_FIELDS.forEach((memberField) => {
      const member = team[memberField];
      if (!member || !memberFilter(member, team)) return;

      normalizedRows.push({
        sno: normalizedRows.length + 1,
        'team name': team.teamName || '',
        name: member.name || '',
        'reg no': member.regNo ?? '',
        'mobile number': member.phoneNo || '',
        department: member.branch || '',
        hostelname: member.hostelName || '',
        'room number': member.roomNo || '',
        'payment status': team.payment?.status || '',
        'image link': team.payment?.receiptUrl || '',
      });
    });
  });

  return normalizedRows;
}

module.exports = { transformTeamsToNormalizedRows };