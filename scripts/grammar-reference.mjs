// Short prose grammar reference, adapted from Wikipedia "Czech conjugation" and
// "Czech declension" (CC BY-SA 4.0). Written for an English speaker who wants to
// build sentences, not for linguists.
export const REFERENCE = [
  {
    id: 'overview',
    title: 'How Czech works',
    body:
      'Czech is a synthetic, highly inflected Slavic language: grammatical role is shown by changing the end of a word rather than by word order or extra helper words. Nouns, adjectives, pronouns and numerals decline (change for case, number and gender); verbs conjugate (change for person, number, tense and aspect). Because endings carry the meaning, word order is relatively free and the subject pronoun is usually dropped — "jsem" already means "I am".',
  },
  {
    id: 'cases',
    title: 'The 7 cases',
    body:
      'Every noun, adjective and pronoun appears in one of seven cases. The case tells you the word’s job in the sentence:',
    list: [
      ['1. Nominative (kdo? co?)', 'the subject — who/what does the action: "Petr spí".'],
      ['2. Genitive (koho? čeho?)', 'possession / "of", and after many prepositions (do, od, z, bez): "sklenice vody" = a glass of water.'],
      ['3. Dative (komu? čemu?)', 'the indirect object — "to/for" someone: "dávám to bratrovi" = I give it to my brother.'],
      ['4. Accusative (koho? co?)', 'the direct object — what the action affects: "vidím psa" = I see a/the dog.'],
      ['5. Vocative (oslovení)', 'used to address or call someone: "Petře!" "Pane!". English has no equivalent.'],
      ['6. Locative (o kom? o čem?)', 'only ever used with prepositions, mostly location/topic (v, na, o, po): "v Praze" = in Prague.'],
      ['7. Instrumental (kým? čím?)', 'the means/"by/with" something, and "to be X": "jedu vlakem" = I go by train.'],
    ],
  },
  {
    id: 'gender',
    title: 'Noun gender',
    body:
      'Every noun is masculine, feminine or neuter, and masculine further splits into animate (people/animals) and inanimate. Gender usually shows in the ending: most consonant-final nouns are masculine, most -a nouns are feminine, most -o nouns are neuter — but there are exceptions, so learn the gender with the word. Gender controls which declension pattern the noun follows and which adjective endings agree with it.',
  },
  {
    id: 'adjectives',
    title: 'Adjective agreement',
    body:
      'Adjectives come before the noun and must agree with it in gender, number and case. "Hard" adjectives end in -ý/-á/-é (nový/nová/nové = new for m/f/n), "soft" adjectives end in -í for all genders (moderní). When the noun changes case, the adjective takes the matching ending too: "nový dům" (nom.) → "v novém domě" (loc.).',
  },
  {
    id: 'verbclasses',
    title: 'The 5 verb classes',
    body:
      'Present-tense verbs are grouped into five classes by the vowel in their 3rd-person singular ending. This tells you how to conjugate the rest:',
    list: [
      ['Class I — -e (nese)', 'consonant stems: nést → nese, číst → čte.'],
      ['Class II — -ne (tiskne)', 'stems in -nout: tisknout → tiskne.'],
      ['Class III — -je (kryje)', 'stems in -ovat / -t: pracovat → pracuje, krýt → kryje.'],
      ['Class IV — -í (prosí)', 'stems in -it / -et / -ět: prosit → prosí, mluvit → mluví.'],
      ['Class V — -á (dělá)', 'stems in -at: dělat → dělá, the largest and most regular class.'],
    ],
  },
  {
    id: 'aspect',
    title: 'Aspect (perfective / imperfective)',
    body:
      'Almost every Czech verb comes as an aspect pair. The imperfective describes an ongoing, repeated or unfinished action (dělat = to be doing), while the perfective describes a single completed whole (udělat = to get done). Crucially, a perfective verb has no present tense — its present-looking forms express the future (udělám = "I will do/finish"), whereas the imperfective forms a true present (dělám = "I do/am doing") and builds its future with the auxiliary "budu" + infinitive (budu dělat = "I will be doing").',
  },
  {
    id: 'negation',
    title: 'Negation',
    body:
      'Negate any verb by attaching the prefix ne- to it: "mluvím" (I speak) → "nemluvím" (I don’t speak); "je" (is) → "není" (is not, the one irregular form). Czech uses double negatives as standard — "nikdy nic neříká" literally "never nothing he-says" = "he never says anything". The negative imperative also takes ne-: "nedělej to!" = don’t do it!',
  },
]
