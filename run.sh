#!/bin/bash
# Runs program

if [ "$1" = "0" ]
then
	echo "Running new program"
	echo "Used when you haven't installed since the last pull"
	npm install
	npm run dev
fi

if [ "$1" = "1" ]
	then
		echo "Running recent program"
		echo "If program requires other packages run './run.sh 0' "
		npm run dev
fi
