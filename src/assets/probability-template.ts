interface CardContent {
  "@probability": {
    type: "card";
    version: "2024-01-01";
  };
  content: {
    front: string;
    back: string;
    size: [number, number, number];
  };
}

interface CardChild {
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
  src: string;
  template: string;
  children?: CardChild[];
}

interface ProbabilityTemplate {
  probability: string;
  templates: {
    [key: string]: {
      name: string;
    };
  };
  children: CardChild[];
}

const createCardContent = (templateName: string, cardNumber: number, size: [number, number, number]): CardContent => ({
  "@probability": {
    type: "card",
    version: "2024-01-01"
  },
  content: {
    front: `/${templateName}-${cardNumber.toString().padStart(3, '0')}-front.png`,
    back: `/${templateName}-${cardNumber.toString().padStart(3, '0')}-back.png`,
    size: size
  }
});

const createCard = (templateName: string, cardNumber: number, cardIndex: number, size: [number, number, number]): CardChild => ({
  name: `${templateName} #${cardNumber}`,
  position: cardIndex === 0 ? [0, 0, 0] : [0, 0, size[2]],
  rotation: [0, 0, 0],
  src: `data:application/json;charset=utf-8,${JSON.stringify(createCardContent(templateName, cardNumber, size))}`,
  template: templateName
});

export function generateProbabilityJson(
  templateName: string, 
  totalCards: number, 
  startingCardNumber: number,
  size: [number, number, number]
): string {
  const cardNumbers = Array.from({ length: totalCards }, (_, i) => i + startingCardNumber);
  
  const cards = cardNumbers.map((cardNumber, index) => 
    createCard(templateName, cardNumber, index, size)
  );
  
  const nestedCards = cards.reduceRight<CardChild | null>((child, card) => {
    if (child) {
      card.children = [child];
    }
    return card;
  }, null);
  
  const probabilityData: ProbabilityTemplate = {
    probability: "2024-01-01",
    templates: {
      [templateName]: {
        name: `${templateName} card`
      }
    },
    children: nestedCards ? [nestedCards] : []
  };
  
  return JSON.stringify(probabilityData, null, 2);
}