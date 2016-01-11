# This is the script that generates the sampled data
# It resamples the data with 1Hz frequency instead of 20Hz
import pandas as pd

def convert(t):
    try:
        d = datetime.datetime.strptime(t,"%Y-%m-%d %H:%M:%S.%f")
    except ValueError:
        d = datetime.datetime.strptime(t,"%Y-%m-%d %H:%M:%S")
    return d

foot=pd.read_csv("2013-11-28_tromso_tottenham.csv")
foot['datestamp'] = foot.timestamp.apply(convert,0)
foot['micros'] = foot.datestamp.apply(lambda x : x.microsecond,0)
sampledData = foot[foot['micros']==500000]