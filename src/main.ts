import "./style.css";

import Alpine from "alpinejs";
import mask from "@alpinejs/mask";
import spacetime, { type Spacetime } from "spacetime";

Alpine.plugin(mask);

(window as unknown as { Alpine: typeof Alpine }).Alpine = Alpine;

Alpine.data("app", () => ({
  dateInput: "",
  get dateValidation():
    | { ok: true; date: Spacetime }
    | { ok: false; errorMessage: string | null } {
    if (!/^\d\d\/\d\d\/\d{4}$/.test(this.dateInput))
      return { ok: false, errorMessage: null };

    const date = spacetime(this.dateInput);

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
