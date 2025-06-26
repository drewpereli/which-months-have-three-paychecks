import "./style.css";

import Alpine from "alpinejs";
import mask from "@alpinejs/mask";
import spacetime, { type Spacetime } from "spacetime";

Alpine.plugin(mask);

(window as unknown as { Alpine: typeof Alpine }).Alpine = Alpine;

type Input = {
  el: HTMLInputElement | null;
  value: string;
  id: string;
  placeholder: string;
  min?: number;
  max?: number;
  width: string;
  isValid: boolean;
};

const inputs: Input[] = [
  {
    id: "month",
    placeholder: "M",
    min: 1,
    max: 12,
    width: "2.5em",
    el: null as HTMLInputElement | null,
    value: "",
    get isValid() {
      if (this.value.length < 1) return true; // Allow empty input
      const month = parseInt(this.value);
      return !isNaN(month) && month >= 1 && month <= 12;
    },
  },
  {
    id: "day",
    placeholder: "D",
    min: 1,
    max: 31,
    width: "2.5em",
    el: null as HTMLInputElement | null,
    value: "",
    get isValid() {
      if (this.value.length < 1) return true; // Allow empty input
      const day = parseInt(this.value);
      return !isNaN(day) && day >= 1 && day <= 31;
    },
  },
  {
    id: "year",
    placeholder: "Y",
    width: "4.5em",
    el: null as HTMLInputElement | null,
    value: "",
    get isValid() {
      if (this.value.length < 3) return true; // Allow empty input
      const year = parseInt(this.value);
      return !isNaN(year);
    },
  },
];

Alpine.data("app", () => ({
  inputs,
  get dateValidation():
    | { ok: true; date: Spacetime }
    | { ok: false; errorMessage: string | null } {
    const dayInput = this.inputs.find((input) => input.id === "day")!;
    const monthInput = this.inputs.find((input) => input.id === "month")!;
    const yearInput = this.inputs.find((input) => input.id === "year")!;

    if (
      dayInput.value.length < 1 ||
      monthInput.value.length < 1 ||
      yearInput.value.length < 4
    ) {
      return { ok: false, errorMessage: null };
    }

    const day = parseInt(dayInput.value);
    const month = parseInt(monthInput.value);
    const year = parseInt(yearInput.value);

    if (!dayInput.isValid || !monthInput.isValid || !yearInput.isValid) {
      return { ok: false, errorMessage: "Please enter a valid date" };
    }

    const date = spacetime(new Date(year, month - 1, day));

    if (!date.isValid())
      return { ok: false, errorMessage: "Please enter a valid date" };

    if (Math.abs(date.diff(spacetime(), "years")) > 5) {
      return {
        ok: false,
        errorMessage: "Please enter a date within 5 years of today",
      };
    }

    return {
      ok: true,
      date,
    };
  },
  get paycheckData() {
    const dateValidation = this.dateValidation;

    if (!dateValidation.ok) return [];

    const { date } = dateValidation;

    const today = new Date();

    const years = [today.getFullYear(), today.getFullYear() + 1];

    return years.map((year) => ({
      year,
      threePaycheckMonths: get3PaycheckMonthsForYear(date, year),
    }));
  },
}));

function get3PaycheckMonthsForYear(
  paycheckDate: Spacetime,
  year: number,
): string[] {
  let currPaycheckDate = getFirstPaycheckOfYear(paycheckDate, year);

  // Add two weeks and log the number of paychecks in each month

  const paycheckCounts: Record<string, number> = {};

  while (currPaycheckDate.year() === year) {
    paycheckCounts[currPaycheckDate.monthName()] =
      (paycheckCounts[currPaycheckDate.monthName()] ?? 0) + 1;
    currPaycheckDate = currPaycheckDate.add(2, "weeks");
  }

  return Object.entries(paycheckCounts)
    .filter((entry) => entry[1] === 3)
    .map(([month]) => month);
}

function getFirstPaycheckOfYear(
  paycheckDate: Spacetime,
  year: number,
): Spacetime {
  const firstDayOfYear = spacetime().year(year).startOf("year");

  // We'll calculate the first paycheck of the year by either adding or subtracting two weeks until we are in the year and within two weeks of the first day of the year
  let firstPaycheckOfYear = paycheckDate.startOf("day");

  while (
    Math.abs(firstPaycheckOfYear.diff(firstDayOfYear, "days")) >= 14 ||
    firstPaycheckOfYear.year() !== year
  ) {
    if (firstPaycheckOfYear.isAfter(firstDayOfYear)) {
      firstPaycheckOfYear = firstPaycheckOfYear.subtract(2, "weeks");
    } else {
      firstPaycheckOfYear = firstPaycheckOfYear.add(2, "weeks");
    }
  }

  return firstPaycheckOfYear;
}

Alpine.start();
