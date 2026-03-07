package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	http.HandleFunc("/api/compile", func(w http.ResponseWriter, r *http.Request) {
		// Temporary dummy response
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"status": "success", "message": "Dummy compile endpoint hit"}`)
	})

	port := 8080
	fmt.Printf("LTeXch Backend running on :%d\n", port)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", port), nil))
}
