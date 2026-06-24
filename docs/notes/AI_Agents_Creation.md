please understand the project, and we are going to basically add some of the AI agents or AI features to it. Please be ready with the main branch right now.

In Plan mode:

I want you to create a new branch with the name of Playwright plus AI, ok? I want you to copy the file, which is the AIAgentFactory.md file. Our plan is that we are basically trying to build something called the AI Agent Factory, Ok? What we have is that we have an Open Router access. We have an API key of Open Router also.
What I want you to develop is:
1. I want you to first of all develop an LLM Gateway access. If this LLM Gateway access utility can help us to make the connection to groq.com (also Open Router, also OpenAI, also Claude, if it is required based on that), based on the environment parameters which are set by the Jenkins, I can use whichever LLM I want to use it. Create that Utility first.
2. I want you to basically generate a custom data generator. Based on the md file which is present in the test data folder, your task will be to use the LLM Gateway. You will send this prompt to the AI or LLM, and it will create this structured data for us. The data which is generated should have our file name properly available and should be available in the test data with a proper folder structure available, which you need to omit. Because we will be using that function, this function should return a proper unique testdata. json path which we can consume directly in one of our test cases.
You also have to write one of the test cases for a basic check that this is what we want., Important rule: I want you to do one more thing: do not modify the existing framework that we already have. We have to add AI layer, or the AI agents layer to factory layer, on top of existing framework that we have. Do not touch the playwright code or the page object model utilities and everything is extra. We are going to just add on the code. We are not going to add extra code in this case okay?

npx playwright init-agents --loop=vscode

playwright-test-planner.agent.md 
I want you to analyze this playwright TestAnalyzer agent.md file. This agent we can use directly with GitHub Copilot, and we can directly use it with Clause as well as opencode and anymore. I know about thi, okay, but I want you to do one thing, Okay? You need to deep dive into my framework of the advancedPlaywrightframework1x, where I have created my end-t-end files as well as my normal API requests also.
I want you to modify this agent according to my framework, because whenever I'm developing my website(let's suppose I'm using the TTA website, TTA cart website), this playwright agent, which is there for planning, is very basic. It does not create the plan according to my application that we are discussing. I have basically created some of the end-to-end scenarios. I have created a login scenario, and I have already created some of my API test case also with API helper as well as fixtures and everything. I want you to do deep research and modify this file according to my test planner agent. I want you to also rename this and create an agent similar to this, but you can rename this as tta-playwright-test-planner.agent.md

Once we get the tta-playwright-test-planner.agent.md file, select it in github code and then give "use this agent, and I want you to open the TTA cart website https://app.thetestingacademy.com/playwright/ttacart/index.html and start exploring the login page for multiple logins and everything.

login - Username : standard_user, Password : tta_secret

navigate to other pages to explore"

then the report will be generated in .md file in specs/login-test-plan.md file

meanwhile go to the other part of terminal and ask "share the updates"

it will ask to add the llm provider and the key, we need to add in .env file and mention that as "I have added the OPENROUTER_API_KEY"

Next "can you please share an update whate we have done, and we will be running one of the scenaris. I want you to also add into the test folder a very simple scenario which will generate test data and verify if the data is generated via an LLM call."

note: there is a way to control the way llm writes the code, we can control it by "whatever the AI agents and everything that you are creating, please make sure they are very minimal and don't write too much code. very simple code you need to write, which I have already used in my framework already. And I want you to modify the customTTAreporter. In the custom reporter, you will create another tab apart from the test result. In the other tab, I want you to write a couple of functions where, whatever the test data generator by using the AI, you need to add that part also. The tab name will be AI word data.

Now, I want you to run this test case again. Open the custom reporter and make sure this data of AIword data is okay, which is the data which is generated as a json, whatever the data generated final output."

go back to next terminal:
add both other agents and give this prompt 
"test-healer, test-generator please add a prefix of tta-, like we have done it for our planner agent also, I want you to thoroughly read the planner file as well as the framework. Make sure you modify our healer agent as well as the generator agent according to our rules. No rules of the advancedPlaywrightframework1x should be broken when you generate code by using the planner, and no rule of any kind of page objects or anything should be broken. Anuthing which you are going to create, make sure you check everything into your repository also, for the healing point of view as well as the planner point of view as well as for the generator point of view. Make sure that you achieve that also in this case.

Okay, now I would have you finalize this. Do heavy research on my framework and start modifying this agent according to our need of advancedPlaywrightframework1x for TTA cart."

can you add one more test case where you will be using the customer-vehicle.structure.json and the data generated, and open a report? create a very simple test case also to verify the data is generated, yes or no.

now create next two agents:
Do one thing:spawn another agent, which will be working as an RCA Agent. It will take the result files of playwright. Whenever there is a failure, you are going to work as an RCA agent. In the custom report, you will add your verdict in an AI verdict tab. You will create another tab. In the tab, you will mention:
- what was the severity of this
- what is a priority for this
- what is the root cause of this failure
You will also point out the root cause as well as helping points in bullet points on how we can fix this error also.
I want you to create a dummy test case which can fail, and then you will run it and open a report with the AI verdict of RCA on the side-by-side. Make sure that you are using the LLM gateway for this same agent factory. we are going to use it.

spawn another agent which will create a Flaky Test case Analyzer AI agent.

What exactly this is: suppose we have multiple runs. For example, we have run one and we have run two. Let's suppose we have the last run. This flaky test analyzer will do one thing: it will check for the previous build if it is the same build, the same number of test cases. What exactly this server will do is it will verify build one with build two, and it will give the correct number of failing test cases and the correct number of flaky test cases.

Also, in this case, I want you to add this information into the tab of the custom reporter where you will mention flaky test cases and highlight those flaky test cases. Also create a simple test case spec file where we will have a lot of flaky intermediate failing test cases. When we run it multiple times, run this two times and give the data of flaky test cases along with that.

second terminal:
add the playwright-cli skill and drag it to terminal and give this prompt:
Can you do ont thing? Whatever the agents that we have created use the MCP right now, but the problem with the MCP is that they are too many tokens. Can you please replace the MCP with this CLI option of playwright? That would be very fast and very token-saving. Also, on the side-by-side, it is possible to create, right? Is it possible to please modify all the tta planner, tta healer and tta generator so that we will use playwright CLI rather than using Playwright MCP, because that is too costly? What do you think about this approach? Please modify all the files accordingly. Please create the new folder with the name of CLI and copy paste your agents which you have modified there. Don't modify the existing test planner, generator and healer with the MCP.

please update the parent README file and commit the changes and push the code to your own branch only, and raise a PR to main.