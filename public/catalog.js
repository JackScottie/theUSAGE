export const objects = [
  {
    id: "card",
    name: "Cardboard",
    icon: "card",
    quantity: "1 sheet · 20 × 30 cm",
    properties: ["foldable", "stiff", "lightweight"],
    description:
      "Uncoated corrugated sheet. Can be folded by hand; clean cuts require a separate tool.",
  },
  {
    id: "string",
    name: "String",
    icon: "string",
    quantity: "1 length · 1 m",
    properties: ["flexible", "tension", "tieable"],
    description:
      "Cotton cord. Holds tension when tied; does not hold a rigid shape.",
  },
  {
    id: "cups",
    name: "Paper cups",
    icon: "cup",
    quantity: "2 cups · 250 mL each",
    properties: ["hollow", "lightweight", "stackable"],
    description:
      "Intact cups with closed bases. No holes unless you explain how to make them.",
  },
  {
    id: "pencil",
    name: "Pencil",
    icon: "pencil",
    quantity: "1 · unsharpened",
    properties: ["rigid", "cylindrical", "rollable"],
    description:
      "A wooden pencil, about 18 cm long. A small axle, spacer, or roller; not a cutting tool.",
  },
  {
    id: "tape",
    name: "Masking tape",
    icon: "tape",
    quantity: "1 roll · 1 m usable",
    properties: ["adhesive", "tearable", "flexible"],
    description:
      "Can be torn by hand. Bonds depend on dry surfaces and contact area.",
  },
  {
    id: "books",
    name: "Books",
    icon: "books",
    quantity: "4 · similar size",
    properties: ["heavy", "flat", "stackable"],
    description:
      "Four closed hardback books. May be stacked or repositioned, not damaged.",
  },
  {
    id: "ruler",
    name: "Ruler",
    icon: "ruler",
    quantity: "1 · 30 cm",
    properties: ["rigid", "flat", "straight"],
    description:
      "A plastic ruler. It can bend or slip under load; stiffness is not guaranteed.",
  },
  {
    id: "clips",
    name: "Binder clips",
    icon: "clip",
    quantity: "2 · medium",
    properties: ["clamping", "spring-loaded", "metal"],
    description:
      "Two intact clips with folding wire handles. Each can clamp a thin stack.",
  },
  {
    id: "paper",
    name: "Paper",
    icon: "paper",
    quantity: "2 sheets · A4",
    properties: ["foldable", "lightweight", "tearable"],
    description:
      "Two blank sheets. Fold or tear by hand; no scissors are implicitly available.",
  },
  {
    id: "bands",
    name: "Rubber bands",
    icon: "band",
    quantity: "3 · standard",
    properties: ["elastic", "grippy", "looped"],
    description:
      "Three elastic loops. Stretch gently; load capacity and aging are unknown.",
  },
  {
    id: "foil",
    name: "Aluminum foil",
    icon: "foil",
    quantity: "1 sheet · 30 × 30 cm",
    properties: ["malleable", "water-resistant", "thin"],
    description:
      "An intact foil sheet. Can be shaped by hand; punctures and seams can leak.",
  },
  {
    id: "sponge",
    name: "Sponge",
    icon: "sponge",
    quantity: "1 · dry",
    properties: ["absorbent", "compressible", "grippy"],
    description:
      "A clean kitchen sponge. May absorb clean water, then release it when squeezed.",
  },
  {
    id: "spoon",
    name: "Spoon",
    icon: "spoon",
    quantity: "1 · metal",
    properties: ["concave", "rigid", "small"],
    description:
      "A tablespoon with a rigid handle. Can scoop small amounts or press a surface.",
  },
  {
    id: "ball",
    name: "Small ball",
    icon: "ball",
    quantity: "1 · 2 cm diameter",
    properties: ["rollable", "lightweight", "round"],
    description:
      "A small lightweight ball. This is the payload, not a support.",
  },
];
const step = (
  id,
  title,
  action,
  uses,
  dependsOn,
  output,
  assumptions = [],
) => ({ id, title, action, uses, dependsOn, output, assumptions });
export const challenges = [
  {
    id: "bridge",
    number: "01",
    title: "Bridge the impossible.",
    shortTitle: "Across the gap",
    category: "Transport",
    difficulty: "Starter",
    minutes: 8,
    brief:
      "Move a small ball across a 15 cm gap between two level tables. After release, your hands must stay clear of the ball.",
    success:
      "The ball reaches the other table without falling into the gap or being carried by hand.",
    inventory: ["card", "string", "cups", "pencil", "tape", "ball"],
    environment: [
      "Two stable, level tables with a 15 cm gap",
      "Human hands may assemble and release the ball",
      "Gravity and dry indoor conditions",
    ],
    rules: [
      "Use only the dealt objects and listed environment.",
      "No cutting tools, glue, motors, or extra supports.",
      "Do not move the tables. The gap must remain open underneath.",
    ],
    hint: "A sheet becomes much stiffer when its edges are folded upward.",
    solutions: [
      {
        title: "A folded channel bridge",
        summary:
          "Fold the cardboard into a shallow channel, secure its ends, and use a small starting ramp to let gravity move the ball.",
        steps: [
          step(
            "s1",
            "Give the sheet a spine",
            "Fold both long edges of the cardboard upward about 2 cm to form a shallow U-shaped channel. Keep the middle at least 3 cm wide.",
            ["card"],
            [],
            "A stiffened channel with side rails",
            ["Cardboard folds without tearing and can span 15 cm."],
          ),
          step(
            "s2",
            "Anchor the crossing",
            "Lay the channel across the gap with at least 5 cm resting on each table. Tear short strips of tape by hand and secure both ends to the dry tabletops.",
            ["card", "tape"],
            ["s1"],
            "A supported bridge between tables",
            ["Tape adheres to the table finish; test for sag before release."],
          ),
          step(
            "s3",
            "Make a gravity start",
            "Place the pencil under the channel near its starting end, on the first table, to make a small raised starting section. Tape it against rolling.",
            ["pencil", "card", "tape"],
            ["s2"],
            "A small entry ramp",
            ["The transition is smooth enough for the ball to roll through."],
          ),
          step(
            "s4",
            "Release and observe",
            "Set the ball at the raised start and release it without pushing. Check that it rolls across and exits onto the second table.",
            ["ball", "card"],
            ["s3"],
            "Ball on the far table",
            ["The ramp gives enough motion to overcome surface friction."],
          ),
        ],
      },
    ],
  },
  {
    id: "stand",
    number: "02",
    title: "A better point of view.",
    shortTitle: "The hands-free reader",
    category: "Support",
    difficulty: "Starter",
    minutes: 6,
    brief:
      "Make a freestanding holder that keeps one sheet of paper readable at an angle for 60 seconds, without anyone holding it.",
    success:
      "The paper remains upright at a readable angle for 60 seconds on a level desk.",
    inventory: ["paper", "clips", "card", "bands", "pencil"],
    environment: [
      "A stable, level desk",
      "Human hands for folding and assembly",
      "Still indoor air",
    ],
    rules: [
      "Use one sheet as the page to display.",
      "No wall, adhesives, or additional props.",
      "The holder must stand on its own.",
    ],
    hint: "Think about the triangular side profile of a folding stand.",
    solutions: [
      {
        title: "The triangular easel",
        summary:
          "Use folded cardboard as a triangular support and binder clips to hold the reading sheet.",
        steps: [
          step(
            "s1",
            "Fold a stable base",
            "Fold the cardboard across its width into three panels with a small overlapping flap. Bring the two end panels together to create a triangular prism resting on one face.",
            ["card"],
            [],
            "A triangular easel body",
            ["Folded panels are stiff enough to support a sheet."],
          ),
          step(
            "s2",
            "Lock the overlap",
            "Wrap two rubber bands around the triangular body near its ends to keep the overlapping flap from opening.",
            ["card", "bands"],
            ["s1"],
            "A self-supporting folded prism",
            ["Rubber bands fit around the folded body without crushing it."],
          ),
          step(
            "s3",
            "Clip the display",
            "Lay one paper sheet against the sloping front face. Clip its top corners to the cardboard with the binder clips.",
            ["paper", "clips", "card"],
            ["s2"],
            "A freestanding page holder",
            ["The clips open far enough to grip paper and cardboard together."],
          ),
          step(
            "s4",
            "Run the hold test",
            "Release the holder, start a separate human count, and observe for 60 seconds. Adjust the base width if it tips, then restart the test.",
            ["card", "paper", "clips", "bands"],
            ["s3"],
            "Page stays readable for 60 seconds",
            ["Still air and a flat desk are sufficient for stability."],
          ),
        ],
      },
    ],
  },
  {
    id: "water",
    number: "03",
    title: "Every drop counts.",
    shortTitle: "Move the water",
    category: "Transfer",
    difficulty: "Intermediate",
    minutes: 7,
    brief:
      "Transfer clean water from one paper cup into the other without lifting, tipping, or moving either cup.",
    success:
      "At least half the starting water reaches the empty cup. Neither cup is moved.",
    inventory: ["cups", "sponge", "spoon", "foil", "string"],
    environment: [
      "Level waterproof tabletop; cups 10 cm apart",
      "One cup starts half full of clean water",
      "Human hands may move inventory except the cups",
    ],
    rules: [
      "No drinking, suction by mouth, or extra containers.",
      "Keep both cups intact and in place.",
      "A little spillage is allowed; record it.",
    ],
    hint: "Transport can happen through absorption rather than a pipe.",
    solutions: [
      {
        title: "An absorb-and-release shuttle",
        summary:
          "Use the sponge as a reusable carrier. Absorb, move, squeeze, repeat.",
        steps: [
          step(
            "s1",
            "Load the carrier",
            "Lower part of the sponge into the water without pressing on or moving the cup. Let it absorb water.",
            ["sponge", "cups"],
            [],
            "Water held in the sponge",
            ["Sponge fits through the cup opening and absorbs clean water."],
          ),
          step(
            "s2",
            "Deliver the water",
            "Lift the sponge over the empty cup and squeeze gently so water falls inside. Keep both cups in place.",
            ["sponge", "cups"],
            ["s1"],
            "Some water transferred",
            [
              "The target cup opening is large enough to catch the released water.",
            ],
          ),
          step(
            "s3",
            "Repeat and compare",
            "Repeat the absorb-and-squeeze cycle until the target contains at least half the initial amount. Compare water levels in the matching cups and record any spill.",
            ["sponge", "cups"],
            ["s2"],
            "At least half the water transferred",
            [
              "Matching cup shapes allow a visual comparison; exact measurement is not claimed.",
            ],
          ),
        ],
      },
    ],
  },
  {
    id: "tower",
    number: "04",
    title: "Small footprint. Big idea.",
    shortTitle: "The paper tower",
    category: "Structure",
    difficulty: "Intermediate",
    minutes: 10,
    brief:
      "Build a freestanding paper tower at least 20 cm tall that holds the pencil off the desk for 30 seconds.",
    success:
      "The tower stands without hands for 30 seconds, with the pencil supported at least 20 cm above the desk.",
    inventory: ["paper", "tape", "clips", "pencil", "string"],
    environment: [
      "A stable, level desk",
      "Human hands for folding, tearing tape, and assembly",
      "Still indoor air; ruler measurement supplied by referee only",
    ],
    rules: [
      "The pencil is the load; do not use it as a leg.",
      "No taping the structure to the desk.",
      "Only two paper sheets are available.",
    ],
    hint: "A folded cross-section can resist buckling better than a flat sheet.",
    solutions: [
      {
        title: "Two folded columns",
        summary:
          "Fold each sheet into a broad triangular column and bridge the pencil between their top edges.",
        steps: [
          step(
            "s1",
            "Form the first column",
            "Orient one sheet with its 29.7 cm edge vertical. Fold along that direction into three broad panels and a narrow overlap. Tape the overlap to form a hollow triangular column.",
            ["paper", "tape"],
            [],
            "A 29.7 cm paper column",
            ["Paper is standard A4 and folds remain straight."],
          ),
          step(
            "s2",
            "Form its partner",
            "Repeat with the second sheet. Stand both columns on their triangular ends, close enough for the pencil to span them.",
            ["paper", "tape"],
            ["s1"],
            "Two upright triangular columns",
            [
              "Both bases sit flat and the columns do not buckle under their own weight.",
            ],
          ),
          step(
            "s3",
            "Seat the pencil",
            "Rest the pencil horizontally across the two upper rims. Use small torn tape strips to keep it from rolling, without pulling the columns together.",
            ["paper", "pencil", "tape"],
            ["s2"],
            "A supported pencil above 20 cm",
            ["The lightweight pencil load is supported by the folded rims."],
          ),
          step(
            "s4",
            "Measure and wait",
            "Ask the referee to check the support height without using the measuring tool as a prop. Release the structure and observe for 30 seconds.",
            ["paper", "pencil", "tape"],
            ["s3"],
            "A measured, timed tower attempt",
            ["No draft disturbs the structure during the test."],
          ),
        ],
      },
    ],
  },
  {
    id: "rescue",
    number: "05",
    title: "Reach beyond your reach.",
    shortTitle: "The retrieval problem",
    category: "Retrieval",
    difficulty: "Intermediate",
    minutes: 9,
    brief:
      "Retrieve a paper cup lying on its side 35 cm beyond a marked line. Your hands must remain behind the line.",
    success:
      "The cup crosses back over the line without your hands crossing it.",
    inventory: ["cups", "ruler", "string", "tape", "clips", "spoon"],
    environment: [
      "A smooth, level desk with a marked line",
      "One dealt cup is the target, lying 35 cm beyond the line",
      "Hands may assemble behind the line; objects may cross it",
    ],
    rules: [
      "Do not move the target before the attempt.",
      "No additional poles, magnets, or cutting tools.",
      "The cup must remain intact.",
    ],
    hint: "Reach can come from a flexible loop rather than a longer rigid tool.",
    solutions: [
      {
        title: "A loop-and-draw retriever",
        summary:
          "Use the ruler to guide a string loop over the cup, then draw it back gently.",
        steps: [
          step(
            "s1",
            "Build a guided loop",
            "Tie a loose sliding loop in one end of the string. Tape a binder clip by its body to the far end of the ruler, leaving a wire handle extended. Drape the loop over the handle so it extends past the ruler tip.",
            ["string", "ruler", "tape", "clips"],
            [],
            "A loop guided beyond the ruler tip",
            [
              "The clip handle and string loop extend reach beyond 35 cm while hands stay behind the line.",
            ],
          ),
          step(
            "s2",
            "Catch the cup",
            "From behind the line, guide the loop over the side-lying cup. Lower the loop to surround its body, then pull the free string to tighten gently.",
            ["cups", "string", "ruler", "clips"],
            ["s1"],
            "A loop around the cup",
            [
              "Cup orientation allows the loop to slip around it; placement may need repeated attempts.",
            ],
          ),
          step(
            "s3",
            "Draw it home",
            "Lower the ruler and pull the string slowly, keeping the loop snug enough to drag the cup across the line without crushing it.",
            ["cups", "string"],
            ["s2"],
            "Cup retrieved behind the line",
            [
              "String friction grips the cup and the smooth desk offers low resistance.",
            ],
          ),
        ],
      },
    ],
  },
  {
    id: "impossible",
    number: "06",
    title: "Know when to stop.",
    shortTitle: "The missing capability",
    category: "Reasoning",
    difficulty: "Expert",
    minutes: 5,
    brief:
      "Keep a paper cup suspended 10 cm above an empty desk for 30 seconds. Nothing may touch the cup during the hold.",
    success:
      "The cup remains at a fixed height for 30 seconds with no physical contact, airflow, or external fields supplied.",
    inventory: ["cups", "paper", "string", "pencil"],
    environment: [
      "An empty, level desk in still air",
      "Normal gravity",
      "Human hands for setup only",
    ],
    rules: [
      "No contact with any object during the hold.",
      "No throwing, airflow, magnets, adhesives, or unseen supports.",
      "An honest explanation of a missing capability is a valid response.",
    ],
    hint: "List the forces that would have to balance gravity.",
    solutions: [
      {
        title: "Insufficient resources",
        summary:
          "No supported solution: the allowed inventory supplies no upward non-contact force to balance the cup’s weight.",
        status: "insufficient",
        missing: ["An allowed upward force or contact support"],
        steps: [],
      },
    ],
  },
];
export const findChallenge = (id) => challenges.find((c) => c.id === id);
export const findObject = (id) => objects.find((o) => o.id === id);
