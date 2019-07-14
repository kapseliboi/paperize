describe "Title Bar items", ->
  context "Profile component", ->
    it "without login we see Sign In", ->
      cy.visit("/")
      cy.contains("Sign In")

    it "with login we see name and Sign Out", ->
      cy.login()
      cy.contains("Avid Gamer")
      cy.contains("Sign Out")

  context "Errors menu", ->
    it "is not visible without login, with error", ->
      cy.visit("/")
      cy.makePaperizeError()
      cy.contains("Errors").should("not.exist")

    it "is not visible with login, without error", ->
      cy.login()
      cy.contains("Errors").should("not.exist")

    describe "logged in with errors", ->
      beforeEach ->
        cy.login()
        cy.makePaperizeError()
        cy.contains("Errors")

      it "has a badge displaying quantity of unread errors", ->
        cy.get('.error-count').contains 1
        cy.makePaperizeError(3)
        cy.get('.error-count').contains 4

      it "maxes out at 20 errors", ->
        cy.makePaperizeError(18)
        cy.get('.error-count').contains 19
        cy.makePaperizeError(1)
        cy.get('.error-count').contains 20
        cy.makePaperizeError(1)
        cy.get('.error-count').contains 20

      context "open the errors modal", ->
        beforeEach ->
          cy.contains("Errors").click()

          cy.contains("Recent Errors")
          cy.contains("ErrorFixture")

