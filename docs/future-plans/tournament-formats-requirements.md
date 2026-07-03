# Tournament Formats and LD Requirements

## Context

This document captures the current product decisions for tournament format support on the website.
The main goal is to build a working MVP for real tournaments first, collect feedback, and avoid
overbuilding rare edge cases.

Terms:

- **APF**: 1 team vs 1 team.
- **BPF**: 2 teams vs 2 teams.
- **LD**: 1 speaker vs 1 speaker.
- **Preliminary**: group/prelim rounds before elimination.
- **Elimination**: playoff/bracket stage.

## Core Decisions

1. A tournament usually has a team format and may also have LD.
2. LD is optional. The organizer chooses whether to add LD during tournament creation.
3. The tournament format is selected during creation and does not change during the tournament.
4. For now, tournaments without preliminary rounds are not supported.
5. Format is defined per stage, not per round.
6. Each stage has exactly one format.
7. LD rounds are separate from team rounds.
8. LD only has an elimination stage.
9. Preliminary rounds are usually 3, but the organizer sets the count during tournament creation.
10. APF is always exactly 2 teams.
11. BPF is always exactly 4 teams.
12. The platform does not assign debate sides. Judges decide the winner; the platform records results.
13. Speaker points are entered during preliminary rounds and are used only for LD selection.
14. Speaker points are hidden from debaters.
15. LD participants are selected after preliminary by organizer action, not fully automatically.
16. If LD is enabled, speaker points are required before the LD bracket can be generated.
17. Organizers need broad edit access because tournament force majeure happens.
18. Public visibility of standings/brackets depends on organizer permission.
19. MVP priority: make a working system and get feedback from real tournaments.
20. Flexible/custom format architecture is out of scope for MVP.

## Supported Tournament Configurations

Known supported configurations:

- APF only.
- BPF only.
- APF + LD.
- BPF + LD.
- APF preliminary + BPF elimination + LD.

Not supported for MVP:

- Tournament with no preliminary stage and only elimination.
- Different formats inside the same stage.
- Changing a stage format during the tournament.
- Extra debate formats beyond APF, BPF, and LD.

To confirm later:

- Whether mixed APF preliminary + BPF elimination should also be allowed without LD.

## Stage and Round Rules

Preliminary:

- Organizer selects the team format for preliminary during tournament creation.
- Preliminary cannot mix APF and BPF round-by-round.
- Organizer sets the number of preliminary rounds during tournament creation.
- Speaker points are entered for each speaker in preliminary rounds.

Elimination:

- Organizer selects the team elimination format during tournament creation.
- Elimination cannot change format mid-stage.
- Team elimination may be APF or BPF depending on tournament setup.
- The organizer should confirm pairings/brackets.
- Results can be edited after publishing.

LD:

- LD is optional.
- LD is separate from the team bracket.
- LD only has elimination.
- LD participants come only from speakers in the team tournament.
- A speaker can continue playing in the team bracket while also participating in LD.
- LD runs in parallel with team elimination, alternating by bracket round.

Example alternating flow:

1. LD 1/8.
2. Team 1/8.
3. LD 1/4.
4. Team 1/4.
5. Continue alternating.

## Result Entry

Roles:

- There is no separate judge role for MVP.
- Results are entered by the organizer or by accounts that the organizer has granted permission to.
- User roles for MVP are organizer and debater.

APF results:

- Judge determines the winner.
- Platform stores one team as winner and one team as loser.
- Debate side is not important for MVP.

BPF results:

- 4 teams participate.
- 2 teams are marked as winners.
- 2 teams are marked as losers.
- BPF positions/roles are desirable, but not necessary for MVP.

LD results:

- 1 speaker vs 1 speaker.
- Judge/organizer records the winning speaker.

## Speaker Points and LD Selection

Speaker points:

- Entered during preliminary rounds.
- Entered for each speaker individually.
- Work the same way for APF and BPF.
- Used only to decide LD eligibility/selection.
- Do not affect team standings.
- Hidden from debaters.

LD selection:

- If the organizer enabled LD during tournament creation, the system may prepare LD after preliminary ends.
- Final LD participant selection should happen by organizer button/action.
- Organizer must be able to edit the LD participant list freely.
- Organizer can add or remove participants manually.
- Tie cases at the cutoff are resolved by organizer decision.
- If required speaker points are missing, the system should warn the organizer and block automatic LD generation until points are entered.

Bracket size:

- Organizer chooses the LD bracket size during tournament creation.
- Only the chosen supported LD sizes should be available for now.
- Additional sizes like top 8, 24, 64 are not needed yet.

## Creation Flow Requirements

Tournament creation should use an advanced setup flow rather than an overly simple one.

Organizer should configure:

- Tournament team format configuration.
- Whether LD is enabled.
- Preliminary format.
- Team elimination format.
- Number of preliminary rounds.
- Number/details of elimination rounds.
- LD participant count/bracket size if LD is enabled.
- Public visibility settings for standings/brackets.

Possible future improvement:

- Add templates such as "Classic APF + LD", "BPF elimination", or "Team only".

## Permissions and Visibility

Organizer:

- Creates the tournament.
- Configures formats and round counts.
- Grants result-entry permission to other accounts.
- Confirms pairings/brackets.
- Can edit results after publishing.
- Can edit LD participants freely.
- Decides whether standings/brackets are public to debaters.

Debater:

- Can participate in team rounds.
- Can participate in LD if selected.
- Should not see speaker points.
- Sees public brackets/standings only if organizer allows it.

## Question-by-Question Answers

### Tournament

1. **Can one tournament have both a team format and LD?**  
   Yes. Usually one tournament has a team format and LD.

2. **Is LD always optional or enabled by default?**  
   LD should be optional. The organizer can add it during tournament creation or create a tournament without it.

3. **Can the format change after tournament creation?**  
   No. The format is set during tournament creation and does not change during the tournament.

4. **Which tournament types should be supported?**  
   Known types: APF only, BPF only, APF + LD, BPF + LD, APF preliminary + BPF elimination + LD.

5. **Should tournaments without preliminary be supported?**  
   Not for now. Even if they may exist, MVP should not support them yet.

### Rounds and Stages

6. **Is format selected for the whole stage or for each round separately?**  
   For the whole stage during tournament creation.

7. **Can preliminary contain rounds with different formats?**  
   No. Each stage has only one format.

8. **Can elimination change format mid-stage?**  
   No. Rare cases exist, but MVP should keep the whole stage in one format.

9. **Are LD rounds separate from team rounds?**  
   Yes.

10. **Does LD have its own preliminary and elimination?**  
    LD only has elimination.

11. **How many preliminary rounds are typical?**  
    Usually 3.

12. **Who sets the number of rounds?**  
    The organizer sets it during tournament creation.

### APF and BPF

13. **Is APF always 2 teams?**  
    Yes, strictly 2 teams.

14. **Is BPF always 4 teams?**  
    Yes, strictly 4 teams.

15. **Are BPF roles/positions needed?**  
    Desirable, but not important for MVP.

16. **Are APF sides needed?**  
    No, not needed for MVP.

17. **Who assigns sides?**  
    Not the platform. Judges handle this; the platform only records who won.

18. **Should the platform balance side history?**  
    No. Not needed.

19. **How is APF victory determined?**  
    The judge determines the winner. The platform records team 1 won / team 2 lost, or vice versa.

20. **How are BPF results counted?**  
    In BPF, 2 teams are winners and 2 teams are losers.

### LD

21. **Is LD always 1 speaker vs 1 speaker?**  
    Yes.

22. **Who can participate in LD?**  
    Only speakers from the team tournament.

23. **Can an LD speaker continue in the team bracket?**  
    Yes.

24. **When do LD matches happen?**  
    In parallel with team elimination, alternating by rounds: LD 1/8, team 1/8, LD 1/4, team 1/4, etc.

25. **Who chooses top 16/top 32?**  
    Organizer chooses the LD participant count during tournament creation.

26. **Are other bracket sizes needed?**  
    No, not for now.

27. **What happens with speaker-point ties at the cutoff?**  
    Organizer decides manually by choosing which speaker participates.

28. **Can the organizer override LD participants?**  
    Yes. Organizer needs full freedom to add/remove/edit LD participants.

### Speaker Points

29. **Are speaker points entered in each preliminary round?**  
    Yes.

30. **Does each player have individual speaker points?**  
    Yes.

31. **Are BPF speaker points handled the same as APF?**  
    Yes.

32. **What fields does a judge enter?**  
    There is no separate judge role for MVP. Organizer or permitted accounts enter results.

33. **Do speaker points affect team standings?**  
    No. They are only for LD selection.

34. **What tie-breakers are needed after speaker points?**  
    Organizer resolves manually.

35. **Should speaker standings be hidden until preliminary ends?**  
    Speaker points should be hidden from debaters.

### Website Creation Flow

36. **Should creation be simple or advanced?**  
    Advanced. Organizer should immediately enter preliminary rounds, elimination setup, LD settings, etc.

37. **Are templates useful?**  
    Yes, templates are a good idea and should be reviewed later.

38. **Should there be warnings if LD is enabled but speaker points are missing?**  
    Yes. If LD is enabled, preliminary result entry must include speaker points. Before LD bracket generation, the system should check for missing speaker points, warn the organizer, and block automatic LD generation until the missing points are entered.

39. **Should LD be created automatically after preliminary?**  
    If LD was enabled, the system can create/prepare it after preliminary, but organizer must be able to edit everything.

40. **When should the system define top 16/top 32?**  
    By organizer button/action after preliminary.

### Admin and Hosting

41. **Who enters results?**  
    Organizer and accounts that the organizer has granted permission to.

42. **What does "during hosting" mean?**  
    This question is not important for requirements. Use clearer product language instead: tournament creation/setup and live organizer controls.

43. **Is a separate "Define LD participants" screen needed?**  
    Yes.

44. **Should organizer confirm every pairing?**  
    Yes.

45. **Can results be edited after publishing?**  
    Yes.

46. **Can participants see brackets/standings publicly?**  
    Only if organizer allows it.

### Future

47. **Should other formats be supported later?**  
    Unknown, but not needed for now.

48. **Should formats be configurable instead of hardcoded?**  
    No. Flexible/custom formats are out of scope for MVP. Build APF, BPF, and LD directly first.

49. **Should format/round change history be stored?**  
    No.

50. **What matters more now: scalable architecture or working MVP?**  
    Working MVP first, then feedback from real tournaments.

## Open Product Questions for Later

- Should APF preliminary + BPF elimination be allowed without LD?
- Which exact LD bracket sizes should be available in the UI?
- How should the advanced tournament creation flow be split into steps?
- What exact permission model is needed for accounts that organizer allows to enter results?
- How should public/private visibility be represented to debaters?
- Do BPF positions need to be recorded after MVP?
- Should templates be added in the first version or after testing with organizers?
