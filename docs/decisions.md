# Decision log

One line per decision: what we chose, and the one reason that settled it.
This is what you mine on Sunday morning when the pitch asks "why did you build it that way".

| When | Decision | Because |
| --- | --- | --- |
| Fri 18 Sep, pre-brief | Private GitHub repo, stack-agnostic skeleton | Challenge unknown; lock in tooling only once the brief lands |
| Sat 19 Sep | The agent runs on one workspace chosen at launch (`scripts/launch.sh <folder>`), never changed in a session | A session then has exactly one confidentiality label, so there is nothing to track or switch |
| Sat 19 Sep | pi runs in a container where only the workspace is writable, with `bash` and Python enabled | Data analysis needs Python, and the container, not a hook, is what keeps a script inside the workspace |
| Sat 19 Sep | The session is at the workspace label from the first message; a provider cleared below it gets no tools and no messages | The agent can only touch the workspace, so any provider could see its data from the first tool call |
| Sat 19 Sep | Provider clearances: google and openai public (cloud, outside the EU), mistral confidential (EU), local models restricted | Where a provider runs decides what data may reach it |
