#!/bin/bash
# Runs program

if [ "$1" = "new-start" ]
then
	echo "Running new program"
	echo "Used when you haven't installed since the last pull"
	npm install
	npm run dev
fi

if [ "$1" = "start" ]
	then
		echo "Running recent program"
		echo "If program requires other packages run './run.sh 0' "
		npm run dev
fi

if [ "$1" = "test" ]
then
	echo "Running tests..."
	npm run test
	echo "Running recent program"
fi

if [ "$1" = "eslint" ]
then 
	echo "ESLint-ing"
	npm run eslint
	echo "Flow-ing"
	npm run flow
fi
