const messagesData: any[] = [
  { text: "1" },
  { text: "2" },
  { text: "3" }
];
let isUser = true;
for (const msg of messagesData) {
  if (!msg.role) {
    msg.role = isUser ? "user" : "assistant";
  }
  isUser = msg.role !== "user"; 
}
console.log(messagesData);
