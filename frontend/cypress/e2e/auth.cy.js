describe("Authentication Flow", () => {
  it("should display the landing page and allow navigation to login", () => {
    cy.visit("/");
    cy.contains("HabitIQ").should("be.visible");
    cy.contains("Log in").click();
    cy.url().should("include", "/login");
    cy.contains("Welcome back").should("be.visible");
  });

  it("should show an error for invalid login credentials", () => {
    cy.visit("/login");
    cy.get("input[type='email']").type("invalid@test.com");
    cy.get("input[type='password']").type("wrongpassword");
    cy.get("button[type='submit']").click();
    cy.contains("Invalid credentials").should("be.visible");
  });
});
