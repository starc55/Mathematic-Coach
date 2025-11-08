export interface PracticeProblem {
  id: string;
  title: string;
  problem: string;
}

export interface PracticeTopic {
  id: string;
  title: string;
  description: string;
  problems: PracticeProblem[];
}

export const practiceTopics: PracticeTopic[] = [
  {
    id: "calculus-derivatives",
    title: "Derivatives",
    description: "Find the rate of change and slopes of curves.",
    problems: [
      {
        id: "deriv-1",
        title: "Basic Power Rule",
        problem: "Find the derivative of $f(x) = 3x^4 - 5x^2 + 7$.",
      },
      {
        id: "deriv-2",
        title: "Product Rule",
        problem: "Find the derivative of $g(x) = (x^2 + 1)e^x$.",
      },
      {
        id: "deriv-3",
        title: "Chain Rule",
        problem: "Find the derivative of $h(t) = \\sin(3t^2)$.",
      },
    ],
  },
  {
    id: "calculus-integrals",
    title: "Integrals",
    description: "Calculate the area under curves.",
    problems: [
      {
        id: "integ-1",
        title: "Basic Antiderivative",
        problem: "Evaluate the indefinite integral $\\int (6x^2 - 8x + 3) dx$.",
      },
      {
        id: "integ-2",
        title: "Integration by Substitution",
        problem: "Evaluate $\\int 2x \\sqrt{1+x^2} dx$.",
      },
      {
        id: "integ-3",
        title: "Definite Integral",
        problem: "Evaluate the definite integral $\\int_0^1 (x^3 + 1) dx$.",
      },
    ],
  },
  {
    id: "algebra-linear",
    title: "Linear Equations",
    description: "Solve equations with one or more variables.",
    problems: [
      {
        id: "linear-1",
        title: "Solve for x",
        problem: "Solve the equation $5(x - 3) = 2(x + 6)$ for $x$.",
      },
      {
        id: "linear-2",
        title: "System of Equations",
        problem: "Solve the system of equations: $$ \\begin{cases} 2x + 3y = 7 \\\\ 4x - y = 9 \\end{cases} $$",
      },
    ],
  },
];
