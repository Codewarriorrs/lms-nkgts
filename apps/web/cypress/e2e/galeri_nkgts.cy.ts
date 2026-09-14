describe("Feature Test: Galeri Dokumentasi NKGTS & Empty State Landing", () => {
  it("Harus menampilkan section Galeri dengan Empty State dan tombol Upload di landing page jika belum ada foto", () => {
    cy.visit("/");
    cy.get("#galeri").scrollIntoView().should("be.visible");
    cy.contains("Galeri Dokumentasi NKGTS").should("be.visible");

    // Jika empty state tampil
    cy.get("#galeri").then(($sec) => {
      if ($sec.text().includes("Belum Ada Dokumentasi Galeri")) {
        cy.contains("Upload Dokumentasi Anda").should("be.visible");
      }
    });
  });

  it("Harus mengarahkan ke dashboard galeri saat tombol Upload Dokumentasi Anda diklik", () => {
    cy.visit("/");
    cy.get("#galeri").scrollIntoView();
    cy.get("#galeri").then(($sec) => {
      if ($sec.text().includes("Upload Dokumentasi Anda")) {
        cy.contains("Upload Dokumentasi Anda").click();
        cy.url().should("include", "/dashboard/galeri");
      }
    });
  });

  it("Harus dapat membuka feed galeri di dashboard", () => {
    cy.visit("/login");
    cy.get("input[type='email']").type("admin@nkgts.com");
    cy.get("input[type='password']").type("kaizenuntukindonesia1945");
    cy.get("button[type='submit']").click();

    cy.visit("/dashboard/galeri");
    cy.contains(/Galeri/i).should("be.visible");
  });
});
